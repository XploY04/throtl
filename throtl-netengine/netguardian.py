#!/usr/bin/env python3
"""
[DEPRECATED] netguardian.py — Monolithic single-file engine (legacy)

This file is the original standalone version of the NetGuardian engine.
It has been replaced by the modular package in src/:

    src/engine.py      — main entry point
    src/sniffer.py     — packet capture and aggregation
    src/throttler.py   — Redis command listener + tc rules
    src/utils.py       — tc/iptables helpers
    src/shared_state.py — shared in-memory state

To run the current engine:
    sudo .venv/bin/python3 -m src.engine

This file is kept for historical reference only. Do NOT use in production.
"""
"""
NetGuardian - Scapy-integrated per-client throttler (with Whitelist)
Drop-in `netguardian_with_whitelist.py` to run inside your venv.

Requirements:
 - Run as root: sudo ./venv/bin/python3 netguardian_with_whitelist.py
 - scapy installed in venv: pip install scapy
 - iproute2 (tc), iptables available

Behavior:
 - Sniffs on WIFI_IF (default wlo1), aggregates bytes per-client per-second
 - If client exceeds THRESH_BYTES_PER_SEC for DURATION seconds, apply throttle
 - Throttles are idempotent: create per-client HTB class + tbf on wifi and uplink
 - Marking uses iptables mangle POSTROUTING with per-client mark
 - Cleans up rules it created on SIGINT/SIGTERM

Config at top of file.
"""

import sys
import os
import time
import signal
import subprocess
import threading
from collections import deque
from contextlib import suppress

# Scapy import
from scapy.all import AsyncSniffer, IP

# ---------------------- CONFIG ----------------------
WIFI_IF = os.environ.get('WIFI_IF', 'wlo1')
UP_IF = os.environ.get('UP_IF', 'enxaa299ebcadf5')
SUBNET = os.environ.get('SUBNET', '10.42.0.0/24')
SUBNET_PREFIX = SUBNET.split('/')[0].rsplit('.', 1)[0]  # '10.42.0' for matching
VEHICLE_VENV_PY = './venv/bin/python3'

# detection
WINDOW_SEC = 10                # sliding window seconds
TICK_SEC = 1                   # aggregation tick
THRESH_BYTES_PER_SEC = 200_000 # ~1.6Mbps (200kB/s) default; change as needed
DEBOUNCE_SECS = 4              # must exceed threshold for this many seconds
UNTHROTTLE_HOLD = 20           # must stay below threshold for this many seconds before unthrottle

# throttle params
RATE = '1mbit'                # target rate string for tc
BURST = '32k'
LATENCY = '50ms'
BASE_MARK = 100               # first iptables mark to allocate; will increment per client

# Whitelist: IPs (comma-separated) that will never be throttled. Override via env var WHITELIST_IPS='10.42.0.18,10.42.0.5'
WHITELIST_IPS = set(filter(None, [ip.strip() for ip in os.environ.get('WHITELIST_IPS', '').split(',')]))

# ---------------------- GLOBALS ----------------------

# safety
CLEANUP_ON_EXIT = True
LOG_PREFIX = '[netguardian] '
DEBUG = os.environ.get('DEBUG', '0') == '1'  # Set DEBUG=1 for verbose logging

client_buckets = {}  # ip -> deque of per-second bytes (len WINDOW_SEC)
client_counters_lock = threading.Lock()
client_state = {}    # ip -> dict(status: 'normal'|'throttled', mark, last_seen, above_count, below_count)
allocated_marks = set()
next_mark = BASE_MARK
running = True
created_resources = {
    'iptables': set(),   # tuple (client_ip, mark)
    'tc_filters_wifi': set(), # tuple (client_ip, mark)
    'tc_filters_up': set(),
    'tc_classes': set(), # mark
}

# ---------------------- HELPERS ----------------------

def log(msg):
    print(f"{LOG_PREFIX}{msg}", flush=True)


def debug(msg):
    if DEBUG:
        print(f"{LOG_PREFIX}[DEBUG] {msg}", flush=True)


def run_cmd(cmd, check=False, capture=False):
    """Run a shell command list; raise on failure if check True."""
    if isinstance(cmd, str):
        proc = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
    else:
        proc = subprocess.run(cmd, capture_output=capture, text=True)
    if check and proc.returncode != 0:
        raise RuntimeError(f"Command failed: {cmd}\nstdout:{proc.stdout}\nstderr:{proc.stderr}")
    return proc


# ---------------------- IP/Tc idempotent helpers ----------------------

def iptables_has_postrouting_mark(ip, mark):
    # returns True if rule exists
    check_cmd = ['iptables', '-t', 'mangle', '-C', 'POSTROUTING', '-s', ip, '-o', UP_IF, '-j', 'MARK', '--set-mark', str(mark)]
    p = subprocess.run(check_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return p.returncode == 0


def iptables_add_postrouting_mark(ip, mark):
    if iptables_has_postrouting_mark(ip, mark):
        return False
    cmd = ['iptables', '-t', 'mangle', '-A', 'POSTROUTING', '-s', ip, '-o', UP_IF, '-j', 'MARK', '--set-mark', str(mark)]
    run_cmd(cmd, check=True)
    created_resources['iptables'].add((ip, mark))
    return True


def iptables_del_postrouting_mark(ip, mark):
    if not iptables_has_postrouting_mark(ip, mark):
        return False
    cmd = ['iptables', '-t', 'mangle', '-D', 'POSTROUTING', '-s', ip, '-o', UP_IF, '-j', 'MARK', '--set-mark', str(mark)]
    run_cmd(cmd, check=True)
    created_resources['iptables'].discard((ip, mark))
    return True


def ensure_tc_root(dev):
    """Ensure there is an HTB root qdisc and a top-level class 1:1."""
    # check if root exists
    out = run_cmd(['tc', 'qdisc', 'show', 'dev', dev], capture=True)
    if 'htb' in out.stdout and '1:' in out.stdout:
        return
    log(f"Setting up root HTB on {dev}")
    run_cmd(['tc', 'qdisc', 'del', 'dev', dev, 'root'], check=False)
    run_cmd(['tc', 'qdisc', 'add', 'dev', dev, 'root', 'handle', '1:', 'htb', 'default', '100'], check=True)
    run_cmd(['tc', 'class', 'add', 'dev', dev, 'parent', '1:', 'classid', '1:1', 'htb', 'rate', '1000mbit'], check=True)


def create_tc_class_and_qdisc(dev, minor, rate=RATE):
    classid = f"1:{minor}"
    if minor in created_resources['tc_classes']:
        return
    log(f"Creating tc class {classid} on {dev} rate={rate}")
    run_cmd(['tc', 'class', 'add', 'dev', dev, 'parent', '1:1', 'classid', classid, 'htb', 'rate', rate, 'ceil', rate], check=True)
    # add tbf qdisc under class to tighten bursts
    run_cmd(['tc', 'qdisc', 'add', 'dev', dev, 'parent', classid, 'handle', f"{minor}0:", 'tbf', 'rate', rate, 'burst', BURST, 'latency', LATENCY], check=True)
    created_resources['tc_classes'].add(minor)


def tc_filter_exists_wifi(ip):
    out = run_cmd(['tc', 'filter', 'show', 'dev', WIFI_IF, 'parent', '1:'], capture=True)
    return ip in out.stdout


def tc_add_filter_wifi(ip, minor):
    # u32 match ip dst ip/32 -> flowid 1:minor
    if (ip, minor) in created_resources['tc_filters_wifi']:
        return False
    log(f"Adding wifi tc u32 filter for {ip} -> 1:{minor}")
    run_cmd(['tc', 'filter', 'add', 'dev', WIFI_IF, 'parent', '1:', 'protocol', 'ip', 'prio', '1', 'u32', 'match', 'ip', 'dst', f"{ip}/32", 'flowid', f"1:{minor}"], check=True)
    created_resources['tc_filters_wifi'].add((ip, minor))
    return True


def tc_del_filter_wifi(ip, minor):
    if (ip, minor) not in created_resources['tc_filters_wifi']:
        # attempt graceful delete if present
        with suppress(Exception):
            run_cmd(['tc', 'filter', 'del', 'dev', WIFI_IF, 'parent', '1:', 'protocol', 'ip', 'prio', '1', 'u32', 'match', 'ip', 'dst', f"{ip}/32", 'flowid', f"1:{minor}"], check=False)
        return False
    run_cmd(['tc', 'filter', 'del', 'dev', WIFI_IF, 'parent', '1:', 'protocol', 'ip', 'prio', '1', 'u32', 'match', 'ip', 'dst', f"{ip}/32", 'flowid', f"1:{minor}"], check=True)
    created_resources['tc_filters_wifi'].discard((ip, minor))
    return True


def tc_add_filter_up(minor):
    # match fw mark = minor
    if minor in created_resources['tc_filters_up']:
        return False
    log(f"Adding uplink tc fw filter for mark {minor} -> 1:{minor}")
    run_cmd(['tc', 'filter', 'add', 'dev', UP_IF, 'parent', '1:', 'protocol', 'ip', 'handle', str(minor), 'fw', 'flowid', f"1:{minor}"], check=True)
    created_resources['tc_filters_up'].add(minor)
    return True


def tc_del_filter_up(minor):
    if minor not in created_resources['tc_filters_up']:
        with suppress(Exception):
            run_cmd(['tc', 'filter', 'del', 'dev', UP_IF, 'parent', '1:', 'protocol', 'ip', 'handle', str(minor), 'fw', 'flowid', f"1:{minor}"], check=False)
        return False
    run_cmd(['tc', 'filter', 'del', 'dev', UP_IF, 'parent', '1:', 'protocol', 'ip', 'handle', str(minor), 'fw', 'flowid', f"1:{minor}"], check=True)
    created_resources['tc_filters_up'].discard(minor)
    return True


# ---------------------- Throttle / Unthrottle ----------------------

def allocate_mark_for_client(ip):
    global next_mark
    # simple allocation: pick next_mark not in use
    while next_mark in allocated_marks:
        next_mark += 1
    allocated_marks.add(next_mark)
    mark = next_mark
    next_mark += 1
    return mark


def free_mark(mark):
    allocated_marks.discard(mark)
    # also remove tc classes record
    created_resources['tc_classes'].discard(mark)


def apply_throttle(ip):
    # idempotent: if already throttled, do nothing
    st = client_state.get(ip, {})
    # Do not throttle whitelisted IPs
    if ip in WHITELIST_IPS:
        log(f"Skipping throttle for whitelisted IP {ip}")
        return
    mark = allocate_mark_for_client(ip)
    minor = mark  # alignment
    # create tc roots if needed
    ensure_tc_root(WIFI_IF)
    ensure_tc_root(UP_IF)
    # create classes/qdiscs on both devs
    create_tc_class_and_qdisc(WIFI_IF, minor)
    create_tc_class_and_qdisc(UP_IF, minor)
    # add filters
    tc_add_filter_wifi(ip, minor)
    tc_add_filter_up(minor)
    # add iptables POSTROUTING MARK
    iptables_add_postrouting_mark(ip, mark)
    # update state
    client_state[ip] = {
        'status': 'throttled',
        'mark': mark,
        'minor': minor,
        'throttled_at': time.time(),
        'last_seen': time.time(),
        'above_count': 0,
        'below_count': 0
    }
    log(f"⚠️  THROTTLED {ip} -> mark={mark} minor={minor} rate={RATE}")


def remove_throttle(ip):
    st = client_state.get(ip)
    if not st or st.get('status') != 'throttled':
        return
    mark = st.get('mark')
    minor = st.get('minor')
    # delete iptables
    with suppress(Exception):
        iptables_del_postrouting_mark(ip, mark)
    # delete tc filters
    with suppress(Exception):
        tc_del_filter_wifi(ip, minor)
    with suppress(Exception):
        tc_del_filter_up(minor)
    # optionally delete class - leave for safety if in use, but try
    with suppress(Exception):
        run_cmd(['tc', 'class', 'del', 'dev', WIFI_IF, 'classid', f"1:{minor}"], check=False)
    with suppress(Exception):
        run_cmd(['tc', 'class', 'del', 'dev', UP_IF, 'classid', f"1:{minor}"], check=False)
    free_mark(mark)
    client_state[ip] = {'status': 'normal', 'last_seen': time.time(), 'above_count': 0, 'below_count': 0}
    log(f"✓ Unthrottled {ip} (mark={mark})")


# ---------------------- Packet aggregation ----------------------

def packet_handler(pkt):
    """
    FIXED: Only count each packet once per client
    - Identifies client by checking if src or dst is in subnet
    - Skips internal traffic (both IPs in subnet)
    - Attributes full packet size to the client endpoint
    """
    if not pkt.haslayer(IP):
        return
    
    ip_layer = pkt[IP]
    src = ip_layer.src
    dst = ip_layer.dst
    b = len(pkt)
    
    # Determine client IP - only count if ONE endpoint is in our subnet
    client_ip = None
    is_upload = False
    
    if src.startswith(SUBNET_PREFIX) and not dst.startswith(SUBNET_PREFIX):
        # Upload: client -> internet
        client_ip = src
        is_upload = True
    elif dst.startswith(SUBNET_PREFIX) and not src.startswith(SUBNET_PREFIX):
        # Download: internet -> client
        client_ip = dst
        is_upload = False
    # else: internal traffic or not our subnet - skip
    
    if client_ip:
        # Skip whitelisted IPs entirely from counting/throttling
        if client_ip in WHITELIST_IPS:
            debug(f"Skipping whitelisted IP {client_ip}")
            return
        with client_counters_lock:
            if client_ip not in client_buckets:
                client_buckets[client_ip] = deque([0]*WINDOW_SEC, maxlen=WINDOW_SEC)
            
            # Add bytes to current second bucket (last element)
            client_buckets[client_ip][-1] += b
            
            # Update client state
            client_state.setdefault(client_ip, {
                'status': 'normal',
                'last_seen': time.time(),
                'above_count': 0,
                'below_count': 0
            })
            client_state[client_ip]['last_seen'] = time.time()
            
            debug(f"{'↑' if is_upload else '↓'} {client_ip}: +{b} bytes")


def tick_aggregator():
    """
    Runs every TICK_SEC, rotates per-second buckets and evaluates heuristics
    """
    while running:
        time.sleep(TICK_SEC)
        now = time.time()
        ips = []
        
        with client_counters_lock:
            ips = list(client_buckets.keys())
            # rotate: append 0 for new second
            for ip in ips:
                client_buckets[ip].append(0)
        
        # evaluate each client
        for ip in ips:
            with client_counters_lock:
                total_bytes = sum(client_buckets[ip])
            
            # Calculate bytes per second over the window
            window_len = min(WINDOW_SEC, len(client_buckets[ip]))
            bps = total_bytes / max(1, window_len)
            
            st = client_state.setdefault(ip, {
                'status': 'normal',
                'last_seen': now,
                'above_count': 0,
                'below_count': 0
            })
            st['last_seen'] = now
            
            # Track consecutive seconds above/below threshold
            if bps > THRESH_BYTES_PER_SEC:
                st['above_count'] = st.get('above_count', 0) + 1
                st['below_count'] = 0
                debug(f"{ip}: {bps/1000:.1f} KB/s (above threshold, count={st['above_count']})")
            else:
                st['below_count'] = st.get('below_count', 0) + 1
                st['above_count'] = 0
                if st.get('status') == 'throttled':
                    debug(f"{ip}: {bps/1000:.1f} KB/s (below threshold, count={st['below_count']})")
            
            # Apply throttle if sustained high usage
            if st.get('status') != 'throttled' and st['above_count'] >= DEBOUNCE_SECS:
                log(f"Client {ip} exceeded {THRESH_BYTES_PER_SEC/1000:.1f} KB/s for {DEBOUNCE_SECS}s (current: {bps/1000:.1f} KB/s)")
                apply_throttle(ip)
            
            # Remove throttle if sustained low usage
            if st.get('status') == 'throttled' and st['below_count'] >= UNTHROTTLE_HOLD:
                log(f"Client {ip} below threshold for {UNTHROTTLE_HOLD}s (current: {bps/1000:.1f} KB/s)")
                remove_throttle(ip)
            
            # Garbage collect stale clients (no packets for 10 minutes)
            if now - st.get('last_seen', now) > 600:
                debug(f"Removing stale client {ip}")
                with client_counters_lock:
                    client_buckets.pop(ip, None)
                if st.get('status') == 'throttled':
                    remove_throttle(ip)
                client_state.pop(ip, None)


# ---------------------- Signal & Cleanup ----------------------

def cleanup_all():
    log('Cleaning up created resources...')
    # reverse cleanup
    for ip, mark in list(created_resources['iptables']):
        with suppress(Exception):
            iptables_del_postrouting_mark(ip, mark)
    for ip, minor in list(created_resources['tc_filters_wifi']):
        with suppress(Exception):
            tc_del_filter_wifi(ip, minor)
    for minor in list(created_resources['tc_filters_up']):
        with suppress(Exception):
            tc_del_filter_up(minor)
    # attempt to remove classes
    for minor in list(created_resources['tc_classes']):
        with suppress(Exception):
            run_cmd(['tc', 'class', 'del', 'dev', WIFI_IF, 'classid', f"1:{minor}"], check=False)
        with suppress(Exception):
            run_cmd(['tc', 'class', 'del', 'dev', UP_IF, 'classid', f"1:{minor}"], check=False)
    log('Cleanup finished')


def handle_sig(signum, frame):
    global running
    log(f'Received signal {signum}, exiting...')
    running = False
    if CLEANUP_ON_EXIT:
        cleanup_all()
    sys.exit(0)


# ---------------------- Entrypoint ----------------------

def main():
    if os.geteuid() != 0:
        log('This script must be run as root. Exiting.')
        sys.exit(1)
    
    log('=' * 60)
    log('NetGuardian - Per-Client Bandwidth Throttler (FIXED)')
    log('=' * 60)
    log(f'WiFi Interface: {WIFI_IF}')
    log(f'Uplink Interface: {UP_IF}')
    log(f'Subnet: {SUBNET}')
    log(f'Threshold: {THRESH_BYTES_PER_SEC/1000:.1f} KB/s (~{THRESH_BYTES_PER_SEC*8/1_000_000:.2f} Mbps)')
    log(f'Throttle Rate: {RATE}')
    log(f'Debounce: {DEBOUNCE_SECS}s above threshold to throttle')
    log(f'Hold: {UNTHROTTLE_HOLD}s below threshold to unthrottle')
    log(f'Debug Mode: {"ENABLED" if DEBUG else "DISABLED"} (set DEBUG=1 for verbose logs)')
    log('=' * 60)
    
    # prepare tc roots so we can add per-client classes later
    ensure_tc_root(WIFI_IF)
    ensure_tc_root(UP_IF)

    # start aggregator thread
    t = threading.Thread(target=tick_aggregator, daemon=True)
    t.start()

    # start scapy AsyncSniffer
    bpf = f"net {SUBNET} and ip"
    log(f"Starting sniffer on {WIFI_IF} (BPF='{bpf}')")
    sniffer = AsyncSniffer(iface=WIFI_IF, prn=packet_handler, store=False, filter=bpf)
    sniffer.start()

    # setup signals
    signal.signal(signal.SIGINT, handle_sig)
    signal.signal(signal.SIGTERM, handle_sig)

    log('Monitoring active. Press Ctrl+C to stop.')
    try:
        while running:
            time.sleep(1)
    finally:
        log('Shutting down sniffer')
        with suppress(Exception):
            sniffer.stop()
        if CLEANUP_ON_EXIT:
            cleanup_all()


if __name__ == '__main__':
    main()
