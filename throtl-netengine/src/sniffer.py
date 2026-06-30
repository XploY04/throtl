# src/sniffer.py
import time
import json
import os
import threading
import redis
from collections import deque
from pathlib import Path
from scapy.all import IP, Ether
from . import shared_state as state
from .utils import log, debug

REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.environ.get('REDIS_PORT', '6379'))
REDIS_DB = int(os.environ.get('REDIS_DB', '0'))
REDIS_STATS_CHANNEL = os.environ.get('REDIS_CHANNEL_STATS', 'network-stats')
REDIS_MAC_CHANNEL = os.environ.get('REDIS_CHANNEL_MAC', 'device-mac-updates')

_redis_lock = threading.Lock()
_redis_client = None
_wifi_mac_cache = {'iface': None, 'mac': None}

def _get_redis_client():
    """Get or create Redis client using config from state"""
    global _redis_client
    host = state.CONFIG.get('REDIS_HOST', REDIS_HOST)
    port = state.CONFIG.get('REDIS_PORT', REDIS_PORT)
    db = state.CONFIG.get('REDIS_DB', REDIS_DB)
    
    with _redis_lock:
        if _redis_client is None:
            try:
                _redis_client = redis.Redis(host=host, port=port, db=db, decode_responses=True)
                log(f"Redis client connected to {host}:{port}")
            except Exception as e:
                log(f"Failed to connect to Redis at {host}:{port}: {e}")
                _redis_client = None
        return _redis_client

def _get_wifi_iface():
    """Get WiFi interface from config"""
    return state.CONFIG.get('WIFI_IF', os.environ.get('WIFI_IF', 'wlo1'))

def _get_wifi_mac():
    """Get MAC address of the WiFi interface"""
    iface = _get_wifi_iface()
    global _wifi_mac_cache
    if iface != _wifi_mac_cache['iface']:
        try:
            mac = Path(f"/sys/class/net/{iface}/address").read_text().strip().lower()
        except OSError:
            mac = None
        _wifi_mac_cache = {'iface': iface, 'mac': mac}
    return _wifi_mac_cache['mac']

# Legacy global for backward compatibility
r = None

# Helper to ensure bucket exists
def _ensure_bucket(ip, window):
    if ip not in state.client_buckets:
        state.client_buckets[ip] = deque([0]*window, maxlen=window)

def packet_handler(pkt):
    if not pkt.haslayer(IP):
        return
    ip_layer = pkt[IP]
    src = ip_layer.src
    dst = ip_layer.dst
    b = len(pkt)

    subnet_prefix = state.CONFIG.get('SUBNET','10.42.0.0/24').split('/')[0].rsplit('.',1)[0]

    client_ip = None
    is_upload = False

    if src.startswith(subnet_prefix) and not dst.startswith(subnet_prefix):
        client_ip = src
        is_upload = True
    elif dst.startswith(subnet_prefix) and not src.startswith(subnet_prefix):
        client_ip = dst
        is_upload = False

    if not client_ip:
        return

    # Extract MAC address from Ethernet layer
    client_mac = None
    if pkt.haslayer(Ether):
        ether = pkt[Ether]
        # For upload: src MAC is client, for download: dst MAC is client
        candidate = ether.src if is_upload else ether.dst
        if candidate:
            candidate = candidate.lower()
        # Skip broadcast/multicast MACs
        if candidate and candidate not in ('ff:ff:ff:ff:ff:ff', '00:00:00:00:00:00'):
            client_mac = candidate
        # If no valid MAC found, try the other direction as fallback
        if not client_mac:
            alt = ether.dst if is_upload else ether.src
            if alt:
                alt = alt.lower()
                if alt not in ('ff:ff:ff:ff:ff:ff', '00:00:00:00:00:00'):
                    client_mac = alt

    whitelist = os.environ.get('WHITELIST_IPS','').split(',')
    if client_ip in whitelist:
        debug(f"Skipping whitelisted IP {client_ip}")
        return

    with state.client_counters_lock:
        _ensure_bucket(client_ip, state.CONFIG['WINDOW_SIZE'])
        state.client_buckets[client_ip][-1] += b
        st = state.client_state.setdefault(client_ip, {'status':'normal','last_seen':time.time(),'above_count':0,'below_count':0})
        st['last_seen'] = time.time()
        st['bytes_last_sec'] = state.client_buckets[client_ip][-1]
        
        # Handle MAC address detection and filtering
        if client_mac:
            iface_mac = _get_wifi_mac()
            # Filter out the WiFi interface's own MAC
            if iface_mac and client_mac == iface_mac:
                prev_mac = st.get('mac')
                if prev_mac and prev_mac != iface_mac:
                    client_mac = prev_mac
                else:
                    client_mac = None
        
        # Store and publish MAC address
        if client_mac:
            old_mac = st.get('mac')
            st['mac'] = client_mac
            st['mac_last_seen'] = time.time()
            
            # If MAC changed or newly discovered, publish to Redis immediately
            if old_mac != client_mac:
                log(f"MAC discovered/updated for {client_ip}: {client_mac.upper()}")
                try:
                    redis_client = _get_redis_client()
                    if redis_client:
                        mac_payload = {
                            'ip': client_ip,
                            'mac': client_mac.upper(),
                            'timestamp': time.time(),
                            'action': 'mac_update'
                        }
                        redis_client.publish(REDIS_MAC_CHANNEL, json.dumps(mac_payload))
                        # Also publish to stats channel for backward compatibility
                        redis_client.publish(REDIS_STATS_CHANNEL, json.dumps(mac_payload))
                        log(f"Published MAC update for {client_ip} to Redis at {state.CONFIG.get('REDIS_HOST')}")
                except Exception as e:
                    log(f"Redis MAC publish error: {e}")
        
        debug(f"{'↑' if is_upload else '↓'} {client_ip} +{b} MAC:{client_mac.upper() if client_mac else 'N/A'}")

def tick_aggregator():
    event_log = deque(maxlen=100)
    while True:
        time.sleep(state.CONFIG['TICK_SEC'])
        now = time.time()
        with state.client_counters_lock:
            ips = list(state.client_buckets.keys())
            for ip in ips:
                state.client_buckets[ip].append(0)

        total_down_bytes = 0
        total_up_bytes = 0
        devices = []

        with state.state_lock:
            ips = list(state.client_buckets.keys())
            for ip in ips:
                dq = state.client_buckets.get(ip, deque([0]*state.CONFIG['WINDOW_SIZE'], maxlen=state.CONFIG['WINDOW_SIZE']))
                total_bytes = sum(dq)
                bps = total_bytes / max(1, len(dq))
                st = state.client_state.setdefault(ip, {'status':'normal','last_seen':now,'above_count':0,'below_count':0})
                st['last_seen'] = now

                if bps >= state.CONFIG['THRESH_BYTES_PER_SEC']:
                    st['above_count'] = st.get('above_count',0) + 1
                    st['below_count'] = 0
                else:
                    st['below_count'] = st.get('below_count',0) + 1
                    st['above_count'] = 0

                # Note: Sniffer makes decision locally but does not run tc; throttler reacts to commands
                if st.get('status') != 'throttled' and st['above_count'] >= state.CONFIG['DEBOUNCE_SECS']:
                    st['status'] = 'throttled'
                    ev = f"[{time.strftime('%H:%M:%S')}] Throttled {ip}"
                    event_log.append(ev)
                    log(ev)
                    if state.CONFIG.get('AUTO_THROTTLE', False):
                        try:
                            rate_str = state.CONFIG.get('RATE', '1mbit')
                            limit_mbps = int(rate_str.replace('mbit', '').replace('kbit', ''))
                            redis_client = _get_redis_client()
                            if redis_client:
                                redis_client.publish('throttle-commands', json.dumps({
                                    'ip': ip, 'action': 'throttle',
                                    'params': {'limit_mbps': limit_mbps}
                                }))
                        except Exception as e:
                            log(f"Auto-throttle publish error: {e}")

                if st.get('status') == 'throttled' and st['below_count'] >= state.CONFIG['UNTHROTTLE_HOLD']:
                    st['status'] = 'normal'
                    ev = f"[{time.strftime('%H:%M:%S')}] Unthrottled {ip}"
                    event_log.append(ev)
                    log(ev)
                    if state.CONFIG.get('AUTO_THROTTLE', False):
                        try:
                            redis_client = _get_redis_client()
                            if redis_client:
                                redis_client.publish('throttle-commands', json.dumps({
                                    'ip': ip, 'action': 'unthrottle', 'params': {}
                                }))
                        except Exception as e:
                            log(f"Auto-unthrottle publish error: {e}")

                devices.append({
                    'ip': ip,
                    'mac': st.get('mac','N/A').upper() if st.get('mac','N/A') != 'N/A' else 'N/A',
                    'hostname': st.get('hostname','N/A'),
                    'down_mbps': (sum(dq) * 8) / (state.CONFIG['TICK_SEC'] * 1024 * 1024),
                    'up_mbps': 0,
                    'status': st.get('status','normal'),
                    'last_seen': st.get('last_seen', now)
                })
                total_down_bytes += sum(dq)

        payload = {
            'timestamp': now,
            'global': {
                'total_down_mbps': (total_down_bytes * 8) / (state.CONFIG['TICK_SEC'] * 1024 * 1024),
                'total_up_mbps': total_up_bytes
            },
            'devices': devices,
            'events': list(event_log),
            'redis_host': state.CONFIG.get('REDIS_HOST', 'unknown')
        }
        try:
            redis_client = _get_redis_client()
            if redis_client:
                redis_client.publish(REDIS_STATS_CHANNEL, json.dumps(payload))
                # Log periodically to confirm Redis is working
                if int(now) % 10 == 0:  # Log every 10 seconds
                    mac_count = sum(1 for d in devices if d['mac'] != 'N/A')
                    log(f"Published stats to Redis at {state.CONFIG.get('REDIS_HOST')}: {len(devices)} devices, {mac_count} with MAC")
        except Exception as e:
            log("Redis publish error:", e)
