# src/engine.py
import os
import sys
import yaml
import signal
import threading
import time
from pathlib import Path
from contextlib import suppress
from scapy.all import AsyncSniffer
from . import shared_state as state
from .utils import log, cleanup_all
from .sniffer import packet_handler, tick_aggregator
from .throttler import command_listener

ROOT = Path(__file__).resolve().parents[1]
PROFILES_FILE = ROOT / 'profiles.yaml'

def load_config():
    if not PROFILES_FILE.exists():
        log("profiles.yaml missing at", PROFILES_FILE)
        sys.exit(1)
    cfg = yaml.safe_load(PROFILES_FILE.read_text())
    profile = cfg.get('profiles', {}).get(os.environ.get('NG_PROFILE', cfg.get('default_profile','hostel')), {})
    merged = {}
    merged.update(cfg.get('GLOBAL', {}))
    merged.update(profile)
    merged['WIFI_IF'] = os.environ.get('WIFI_IF', merged.get('WIFI_IF','wlo1'))
    merged['UP_IF'] = os.environ.get('UP_IF', merged.get('UP_IF','enxaa299ebcadf5'))
    merged['SUBNET'] = os.environ.get('SUBNET', merged.get('SUBNET','10.42.0.0/24'))
    merged['TICK_SEC'] = int(os.environ.get('TICK_SEC', merged.get('TICK_SEC',1)))
    merged['WINDOW_SIZE'] = int(os.environ.get('WINDOW_SIZE', merged.get('WINDOW_SIZE',10)))
    merged['THRESH_BYTES_PER_SEC'] = int(os.environ.get('THRESH_BYTES_PER_SEC', merged.get('THRESH_BYTES_PER_SEC',200000)))
    merged['DEBOUNCE_SECS'] = int(os.environ.get('DEBOUNCE_SECS', merged.get('DEBOUNCE_SECS',4)))
    merged['UNTHROTTLE_HOLD'] = int(os.environ.get('UNTHROTTLE_HOLD', merged.get('UNTHROTTLE_HOLD',20)))
    merged['RATE'] = os.environ.get('RATE', merged.get('RATE','1mbit'))
    merged['BURST'] = os.environ.get('BURST', merged.get('BURST','32k'))
    merged['LATENCY'] = os.environ.get('LATENCY', merged.get('LATENCY','50ms'))
    merged['REDIS_HOST'] = os.environ.get('REDIS_HOST', merged.get('REDIS_HOST', 'localhost'))
    merged['REDIS_PORT'] = int(os.environ.get('REDIS_PORT', merged.get('REDIS_PORT', 6379)))
    merged['REDIS_DB'] = int(os.environ.get('REDIS_DB', merged.get('REDIS_DB', 0)))
    auto_throttle_env = os.environ.get('AUTO_THROTTLE')
    merged['AUTO_THROTTLE'] = (auto_throttle_env.lower() in ('1', 'true', 'yes') if auto_throttle_env else merged.get('AUTO_THROTTLE', False))
    state.CONFIG.clear()
    state.CONFIG.update(merged)
    log("Config loaded:", state.CONFIG)

def _sig_handler(signum, frame):
    log("Signal received, cleanup and exit")
    cleanup_all(state.CONFIG.get('WIFI_IF'), state.CONFIG.get('UP_IF'))
    sys.exit(0)

def main():
    if os.geteuid() != 0:
        log("Must run as root.")
        sys.exit(1)
    load_config()
    signal.signal(signal.SIGINT, _sig_handler)
    signal.signal(signal.SIGTERM, _sig_handler)

    log("Starting NetGuardian engine")
    # start aggregator thread
    agg = threading.Thread(target=tick_aggregator, daemon=True)
    agg.start()

    # start sniffer
    bpf = f"ip and net {state.CONFIG.get('SUBNET')}"
    sniffer = AsyncSniffer(iface=state.CONFIG.get('WIFI_IF'), prn=packet_handler, store=False, filter=bpf)
    sniffer.start()
    log(f"Sniffer started on {state.CONFIG.get('WIFI_IF')} (BPF='{bpf}')")

    # start throttler in another thread
    thr = threading.Thread(target=command_listener, daemon=True)
    thr.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        log("Shutting down")
    finally:
        with suppress(Exception):
            sniffer.stop()
        cleanup_all(state.CONFIG.get('WIFI_IF'), state.CONFIG.get('UP_IF'))
        log("Stopped")

if __name__ == "__main__":
    main()
