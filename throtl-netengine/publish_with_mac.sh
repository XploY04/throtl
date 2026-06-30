#!/usr/bin/env bash
STATE_FILE=/tmp/netguardian_state.json
REDIS_HOST=${REDIS_HOST:-10.42.0.137}
REDIS_PORT=${REDIS_PORT:-6379}
SLEEP_SEC=${PUBLISH_SLEEP:-1}

while true; do
  if [ -f "$STATE_FILE" ]; then
    # build JSON mapping ip->mac from arp (skip header)
    ARP_JSON=$(awk 'NR>1 {printf "\"%s\":\"%s\",",$1,$3}' <(arp -n) | sed 's/,$//')
    if [ -n "$ARP_JSON" ]; then
      ARP_JSON="{${ARP_JSON}}"
    else
      ARP_JSON="{}"
    fi

    # inject mac into each client entry and publish only if file valid
    jq --argjson arp "$ARP_JSON" \
      '.clients |= with_entries(.value += {mac: ($arp[.key] // "unknown")})' \
      "$STATE_FILE" 2>/dev/null | \
      xargs -0 -I{} sh -c "printf '%s' '{}' | redis-cli -h \"$REDIS_HOST\" -p \"$REDIS_PORT\" PUBLISH network-stats \"\$(cat)\"" \
      && true
  fi
  sleep "$SLEEP_SEC"
done
