# src/throttler.py
import os
import time
import json
import redis
from redis.exceptions import RedisError
from .utils import log, apply_throttle, remove_throttle
from . import shared_state as state

DEFAULT_REDIS_HOST = os.environ.get('REDIS_HOST','localhost')
DEFAULT_REDIS_PORT = int(os.environ.get('REDIS_PORT','6379'))
DEFAULT_REDIS_DB = int(os.environ.get('REDIS_DB','0'))
DEFAULT_COMMAND_CHANNEL = os.environ.get('REDIS_CHANNEL_COMMANDS', 'throttle-commands')

def _build_redis_client():
    host = state.CONFIG.get('REDIS_HOST', DEFAULT_REDIS_HOST)
    port = state.CONFIG.get('REDIS_PORT', DEFAULT_REDIS_PORT)
    db = state.CONFIG.get('REDIS_DB', DEFAULT_REDIS_DB)
    return redis.Redis(host=host, port=port, db=db, decode_responses=True)


def command_listener():
    channel = state.CONFIG.get('REDIS_CHANNEL_COMMANDS', DEFAULT_COMMAND_CHANNEL)
    wifi_if = state.CONFIG.get('WIFI_IF')
    up_if = state.CONFIG.get('UP_IF')
    rate = state.CONFIG.get('RATE')
    burst = state.CONFIG.get('BURST', '32k')
    latency = state.CONFIG.get('LATENCY', '50ms')

    while True:
        host = state.CONFIG.get('REDIS_HOST', DEFAULT_REDIS_HOST)
        port = state.CONFIG.get('REDIS_PORT', DEFAULT_REDIS_PORT)
        db = state.CONFIG.get('REDIS_DB', DEFAULT_REDIS_DB)
        try:
            redis_client = _build_redis_client()
            pubsub = redis_client.pubsub(ignore_subscribe_messages=True)
            pubsub.subscribe(channel)
            log(f"Throttler listening on Redis {channel} ({host}:{port}/{db})")

            for msg in pubsub.listen():
                if msg is None:
                    time.sleep(0.1)
                    continue
                if msg.get('type') != 'message':
                    continue
                try:
                    data = msg.get('data')
                    if isinstance(data, bytes):
                        data = data.decode()
                    cmd = json.loads(data)
                    ip = cmd.get('ip')
                    action = cmd.get('action')
                    params = cmd.get('params', {})
                    if not ip or not action:
                        log("Invalid throttle cmd:", cmd)
                        continue
                    log("Throttler received:", action, ip, params)
                    if action == 'throttle':
                        limit_mbps = params.get('limit_mbps')
                        rate_str = f"{limit_mbps}mbit" if limit_mbps else rate
                        apply_throttle(ip, wifi_if, up_if, rate_str, burst, latency)
                    elif action == 'unthrottle':
                        remove_throttle(ip, wifi_if, up_if)
                    else:
                        log("Unknown action:", action)
                except Exception as handler_err:
                    log("Error processing throttle command:", handler_err)
        except RedisError as redis_err:
            log("Redis listener error:", redis_err)
            time.sleep(2)
