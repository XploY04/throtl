# src/utils.py
import os
import shlex
import subprocess
import threading
import time
from contextlib import suppress
from . import shared_state as state

LOG_LOCK = threading.Lock()

def log(*args, **kwargs):
    with LOG_LOCK:
        ts = time.strftime('%Y-%m-%d %H:%M:%S')
        print(ts, *args, **kwargs, flush=True)

def debug(*args, **kwargs):
    if os.environ.get('NG_DEBUG','0') == '1':
        log("DEBUG:", *args, **kwargs)

def run_cmd(cmd, check=False, capture=False):
    """Run command (list or string)."""
    try:
        if isinstance(cmd, str):
            proc = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
        else:
            proc = subprocess.run(cmd, capture_output=capture, text=True)
        if check and proc.returncode != 0:
            raise RuntimeError(f"Command failed: {cmd}\nstdout:{proc.stdout}\nstderr:{proc.stderr}")
        return proc
    except Exception as e:
        return subprocess.CompletedProcess(args=cmd, returncode=1, stdout='', stderr=str(e))

# ------------------ iptables / tc helpers (idempotent) ------------------

def iptables_has_postrouting_mark(ip, mark, up_if):
    check_cmd = ['iptables', '-t', 'mangle', '-C', 'POSTROUTING', '-s', ip, '-o', up_if, '-j', 'MARK', '--set-mark', str(mark)]
    p = subprocess.run(check_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return p.returncode == 0

def iptables_add_postrouting_mark(ip, mark, up_if):
    if iptables_has_postrouting_mark(ip, mark, up_if):
        return False
    cmd = ['iptables', '-t', 'mangle', '-A', 'POSTROUTING', '-s', ip, '-o', up_if, '-j', 'MARK', '--set-mark', str(mark)]
    run_cmd(cmd, check=True)
    state.created_resources['iptables'].add((ip, mark))
    return True

def iptables_del_postrouting_mark(ip, mark, up_if):
    if not iptables_has_postrouting_mark(ip, mark, up_if):
        return False
    cmd = ['iptables', '-t', 'mangle', '-D', 'POSTROUTING', '-s', ip, '-o', up_if, '-j', 'MARK', '--set-mark', str(mark)]
    run_cmd(cmd, check=True)
    state.created_resources['iptables'].discard((ip, mark))
    return True

def ensure_tc_root(dev):
    out = run_cmd(['tc', 'qdisc', 'show', 'dev', dev], capture=True)
    if 'htb' in out.stdout and '1:' in out.stdout:
        return
    log(f"Setting up HTB root on {dev}")
    run_cmd(['tc', 'qdisc', 'del', 'dev', dev, 'root'], check=False)
    run_cmd(['tc', 'qdisc', 'add', 'dev', dev, 'root', 'handle', '1:', 'htb', 'default', '100'], check=True)
    run_cmd(['tc', 'class', 'add', 'dev', dev, 'parent', '1:', 'classid', '1:1', 'htb', 'rate', '1000mbit'], check=True)

def create_tc_class_and_qdisc(dev, minor, rate, burst, latency):
    classid = f"1:{minor}"
    if minor in state.created_resources['tc_classes']:
        return
    log(f"Creating tc class {classid} on {dev} rate={rate}")
    run_cmd(['tc', 'class', 'add', 'dev', dev, 'parent', '1:1', 'classid', classid, 'htb', 'rate', rate, 'ceil', rate], check=True)
    run_cmd(['tc', 'qdisc', 'add', 'dev', dev, 'parent', classid, 'handle', f"{minor}0:", 'tbf', 'rate', rate, 'burst', burst, 'latency', latency], check=True)
    state.created_resources['tc_classes'].add(minor)

def tc_add_filter_wifi(ip, minor, wifi_if):
    if (ip, minor) in state.created_resources['tc_filters_wifi']:
        return False
    run_cmd(['tc', 'filter', 'add', 'dev', wifi_if, 'parent', '1:', 'protocol', 'ip', 'prio', '1', 'u32', 'match', 'ip', 'dst', f"{ip}/32", 'flowid', f"1:{minor}"], check=True)
    state.created_resources['tc_filters_wifi'].add((ip, minor))
    return True

def tc_del_filter_wifi(ip, minor, wifi_if):
    if (ip, minor) not in state.created_resources['tc_filters_wifi']:
        with suppress(Exception):
            run_cmd(['tc', 'filter', 'del', 'dev', wifi_if, 'parent', '1:', 'protocol', 'ip', 'prio', '1', 'u32', 'match', 'ip', 'dst', f"{ip}/32", 'flowid', f"1:{minor}"], check=False)
        return False
    run_cmd(['tc', 'filter', 'del', 'dev', wifi_if, 'parent', '1:', 'protocol', 'ip', 'prio', '1', 'u32', 'match', 'ip', 'dst', f"{ip}/32", 'flowid', f"1:{minor}"], check=True)
    state.created_resources['tc_filters_wifi'].discard((ip, minor))
    return True

def tc_add_filter_up(minor, up_if):
    if minor in state.created_resources['tc_filters_up']:
        return False
    run_cmd(['tc', 'filter', 'add', 'dev', up_if, 'parent', '1:', 'protocol', 'ip', 'handle', str(minor), 'fw', 'flowid', f"1:{minor}"], check=True)
    state.created_resources['tc_filters_up'].add(minor)
    return True

def tc_del_filter_up(minor, up_if):
    if minor not in state.created_resources['tc_filters_up']:
        with suppress(Exception):
            run_cmd(['tc', 'filter', 'del', 'dev', up_if, 'parent', '1:', 'protocol', 'ip', 'handle', str(minor), 'fw', 'flowid', f"1:{minor}"], check=False)
        return False
    run_cmd(['tc', 'filter', 'del', 'dev', up_if, 'parent', '1:', 'protocol', 'ip', 'handle', str(minor), 'fw', 'flowid', f"1:{minor}"], check=True)
    state.created_resources['tc_filters_up'].discard(minor)
    return True

# ------------------ Mark allocation ------------------

_next_mark = int(os.environ.get('BASE_MARK', '100'))

def allocate_mark_for_ip(ip):
    global _next_mark
    with state.state_lock:
        while _next_mark in state.allocated_marks:
            _next_mark += 1
        mark = _next_mark
        state.allocated_marks.add(mark)
        _next_mark += 1
        return mark

def free_mark(mark):
    with state.state_lock:
        state.allocated_marks.discard(mark)
        state.created_resources['tc_classes'].discard(mark)

# ------------------ Throttle operations (high-level) ------------------

def apply_throttle(ip, wifi_if, up_if, rate, burst, latency):
    if ip in os.environ.get('WHITELIST_IPS','').split(','):
        log(f"Skipping throttle for whitelisted {ip}")
        return
    mark = allocate_mark_for_ip(ip)
    minor = mark
    ensure_tc_root(wifi_if)
    ensure_tc_root(up_if)
    create_tc_class_and_qdisc(wifi_if, minor, rate, burst, latency)
    create_tc_class_and_qdisc(up_if, minor, rate, burst, latency)
    tc_add_filter_wifi(ip, minor, wifi_if)
    tc_add_filter_up(minor, up_if)
    iptables_add_postrouting_mark(ip, mark, up_if)
    with state.state_lock:
        state.client_state[ip] = {
            'status': 'throttled',
            'mark': mark,
            'minor': minor,
            'throttled_at': time.time(),
            'last_seen': time.time(),
            'above_count': 0,
            'below_count': 0
        }
    log(f"Throttled {ip} mark={mark} rate={rate}")

def remove_throttle(ip, wifi_if, up_if):
    st = state.client_state.get(ip)
    if not st or st.get('status') != 'throttled':
        return
    mark = st.get('mark')
    minor = st.get('minor')
    with suppress(Exception):
        iptables_del_postrouting_mark(ip, mark, up_if)
    with suppress(Exception):
        tc_del_filter_wifi(ip, minor, wifi_if)
    with suppress(Exception):
        tc_del_filter_up(minor, up_if)
    with suppress(Exception):
        run_cmd(['tc', 'class', 'del', 'dev', wifi_if, 'classid', f"1:{minor}"], check=False)
    with suppress(Exception):
        run_cmd(['tc', 'class', 'del', 'dev', up_if, 'classid', f"1:{minor}"], check=False)
    free_mark(mark)
    with state.state_lock:
        state.client_state[ip] = {'status': 'normal', 'last_seen': time.time(), 'above_count': 0, 'below_count': 0}
    log(f"Unthrottled {ip} mark={mark}")

def cleanup_all(wifi_if, up_if):
    log("Cleaning up resources")
    with state.state_lock:
        for ip, mark in list(state.created_resources['iptables']):
            with suppress(Exception):
                iptables_del_postrouting_mark(ip, mark, up_if)
        for ip, minor in list(state.created_resources['tc_filters_wifi']):
            with suppress(Exception):
                tc_del_filter_wifi(ip, minor, wifi_if)
        for minor in list(state.created_resources['tc_filters_up']):
            with suppress(Exception):
                tc_del_filter_up(minor, up_if)
        for minor in list(state.created_resources['tc_classes']):
            with suppress(Exception):
                run_cmd(['tc', 'class', 'del', 'dev', wifi_if, 'classid', f"1:{minor}"], check=False)
            with suppress(Exception):
                run_cmd(['tc', 'class', 'del', 'dev', up_if, 'classid', f"1:{minor}"], check=False)
    log("Cleanup done")
