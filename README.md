# throtl

A per-device Wi-Fi bandwidth monitor and throttler. Turn a Linux laptop into a
Wi-Fi hotspot, watch every connected device's live download usage, and throttle
or unthrottle any device with one click from a web dashboard.

This repository collects the three components that make up the full system:

| Directory | Component | Stack |
|-----------|-----------|-------|
| [`throtl-netengine/`](throtl-netengine/) | Network engine: packet sniffing, traffic accounting, and `tc`/`iptables` throttling | Python, Scapy, Redis |
| [`throttle-backend/`](throttle-backend/) | Backend API and real-time relay between engine and frontend | Django, Django REST Framework, Channels, Redis |
| [`throtl/`](throtl/) | Web dashboard for live monitoring and device control | React 19, TypeScript, Vite |

A live build of the frontend is at https://throtl.vercel.app.

## How it works

The three components never call each other directly. They communicate through
Redis pub/sub channels, which lets the engine run on the router/hotspot machine
while the backend and frontend run anywhere that can reach the same Redis.

```
                      publishes stats              forwards over
                      to "network-stats"           WebSocket group
  ┌──────────────┐   ───────────────▶  ┌─────────┐  ──────────────▶  ┌──────────┐
  │ net engine   │                     │  Redis  │                   │  Django  │
  │ (Scapy +     │   ◀───────────────  │ pub/sub │  ◀──────────────  │ backend  │
  │  tc/iptables)│   subscribes to     └─────────┘  publishes to     └────┬─────┘
  └──────────────┘   "throttle-commands"            "throttle-commands"   │
        ▲                                                                 │ REST + WS
        │ applies tc qdisc / iptables MARK                                ▼
        │ on the actual network interfaces                          ┌──────────┐
        └─────────────────────────────────────────────────────────▶│  React   │
                                                                    │ dashboard│
                                                                    └──────────┘
```

Data flow in words:

1. The **engine** sniffs packets on the hotspot interface, sums bytes per client
   IP over a sliding window, and publishes a stats snapshot to the Redis
   `network-stats` channel every tick (1s by default).
2. The **backend** runs a `redis_listener` management command that subscribes to
   `network-stats`, caches the latest snapshot, and pushes it to all connected
   browsers over a Django Channels WebSocket group.
3. The **frontend** opens a WebSocket to the backend, renders live per-device
   charts, and calls the REST API when you click throttle/unthrottle.
4. A throttle click becomes a `POST /api/throttle/`, which the backend publishes
   to the Redis `throttle-commands` channel.
5. The engine's command listener receives the command and applies (or removes) a
   `tc` HTB class plus an `iptables` mangle MARK on the real interfaces.

The engine can also throttle **automatically**: if a device stays above the
configured threshold for `DEBOUNCE_SECS`, it self-throttles (when
`AUTO_THROTTLE` is enabled in `profiles.yaml`).

## Prerequisites

- A Linux machine for the engine (it needs `tc`, `iptables`, `iproute2`, and root).
  The dashboard and backend can run on any OS.
- Python 3.8+ (3.11 used in development)
- Node.js 18+ and npm
- A Redis server reachable by both the engine and the backend

## Quick start

Run each component in its own terminal. Start Redis first.

### 0. Redis

```bash
redis-server          # or: sudo systemctl start redis  /  brew services start redis
redis-cli ping        # expect: PONG
```

### 1. Network engine (`throtl-netengine/`)

The engine must run as root because it sniffs packets and edits `tc`/`iptables`.
Before running, create the hotspot and enable NAT (the full beginner walkthrough
is in [`throtl/README.md`](throtl/README.md)).

```bash
cd throtl-netengine
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Set your interfaces; defaults live in profiles.yaml
export WIFI_IF=wlo1          # hotspot interface
export UP_IF=enp3s0          # uplink (internet) interface
export REDIS_HOST=127.0.0.1

sudo .venv/bin/python3 -m src.engine
```

Behaviour is configured by `profiles.yaml` (threshold, debounce, rate, auto-throttle)
and overridable per-run with environment variables. Select a profile with
`NG_PROFILE=home` (defaults to `hostel`).

### 2. Backend (`throttle-backend/`)

```bash
cd throttle-backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env         # then edit values
python manage.py migrate

# Terminal A: ASGI server (WebSockets need daphne, not runserver)
daphne -b 0.0.0.0 -p 8002 netguardian.asgi:application

# Terminal B: Redis-to-WebSocket bridge
python manage.py redis_listener
```

The backend reads config from `.env` via `python-decouple`. Relevant keys:

```env
SECRET_KEY=change-me
DEBUG=True
GEMINI_API_KEY=your-google-gemini-key   # optional; profile generation runs in demo mode without it
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
```

### 3. Frontend (`throtl/`)

```bash
cd throtl
npm install
cp .env.example .env          # point it at your backend
npm run dev                   # Vite dev server, default http://localhost:5173
```

```env
VITE_API_BASE_URL=http://localhost:8002
VITE_WS_BASE_URL=ws://localhost:8002
```

Open the dev server URL, go to the dashboard, and you should see live devices
once the engine is publishing stats.

## API reference (backend)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET`  | `/api/health/` | Service health check |
| `GET`  | `/api/devices/` | Latest cached network stats snapshot |
| `POST` | `/api/throttle/` | Publish a throttle/unthrottle command |
| `POST` | `/api/generate-profile/` | Turn questionnaire answers into a throttle profile |
| `WS`   | `/ws/stats/` | Live stats stream (trailing slash required) |

`POST /api/throttle/` body:

```json
{ "ip": "10.42.0.140", "action": "throttle" }
```

Stats snapshot shape (published by the engine, served by `/api/devices/` and the WebSocket):

```json
{
  "timestamp": 1700000000.0,
  "global": { "total_down_mbps": 25.5, "total_up_mbps": 0 },
  "devices": [
    { "ip": "10.42.0.140", "mac": "AA:BB:CC:DD:EE:FF", "hostname": "phone",
      "down_mbps": 15.3, "up_mbps": 0, "status": "throttled" }
  ],
  "events": ["[10:42:15] Throttled 10.42.0.140"]
}
```

## Docker (backend only)

```bash
cd throttle-backend
docker-compose up   # starts the Django backend and a Redis container
```

## Known limitations

These are honest notes about the current state, not a roadmap.

- **AI profile generation runs in demo mode.** `GenerateProfileView` returns a
  hardcoded profile; the real Gemini call is present but commented out.
- **The throttle rate is fixed at 1 Mbps in the backend.** `ThrottleControlView`
  hardcodes `limit_mbps: 1` regardless of what the client requests.
- **Upload bandwidth is not measured.** The engine reports `up_mbps: 0`; only
  download is accounted per device.
- **Port numbers vary across the older docs/scripts** (8000/8002/8082). This
  README standardizes on `8002` to match the frontend's default; pick one and
  keep the engine, backend, and frontend `.env` consistent.
- **No authentication.** The API and dashboard are open; intended for a trusted
  LAN, not the public internet.

## Repository layout

```
throttle/
├── throtl-netengine/   # Python engine (Scapy sniffer + tc/iptables throttler)
│   ├── src/            # modular engine: engine, sniffer, throttler, utils, shared_state
│   └── profiles.yaml   # threshold / rate / debounce profiles
├── throttle-backend/   # Django + Channels + DRF
│   ├── api/            # views, models, consumers, redis_listener command
│   └── netguardian/    # Django project (settings, asgi, urls)
└── throtl/             # React + TypeScript + Vite dashboard
    └── src/            # components, pages, hooks, services/api.ts
```

## License

MIT. See [LICENSE](LICENSE).
