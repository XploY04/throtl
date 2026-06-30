# src/shared_state.py
import threading
from collections import deque

CONFIG = {}

client_buckets = {}  # ip -> deque of per-second bytes
client_state = {}    # ip -> dict(status, mark, counters, etc.)
allocated_marks = set()

created_resources = {
    'iptables': set(),       # (ip, mark)
    'tc_filters_wifi': set(),# (ip, minor)
    'tc_filters_up': set(),  # minor
    'tc_classes': set(),     # minor
}

client_counters_lock = threading.Lock()
state_lock = threading.Lock()
