"""
[DEPRECATED] server.py — Legacy FastAPI state server

This was an early REST API for exposing network state directly from the engine.
It has been replaced by the Django backend in throttle-backend/, which provides:
  - REST API (api/views.py)
  - WebSocket feed (api/consumers.py)
  - Redis-based communication with the engine

This file is kept for historical reference. Do NOT use in production.
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import subprocess, os, json, time, shlex
from contextlib import suppress

NET_STATE = os.environ.get('STATE_FILE', '/tmp/netguardian_state.json')
WIFI_IF = os.environ.get('WIFI_IF','wlo1')
UP_IF = os.environ.get('UP_IF','enx12caf22c40ba')  # change if needed
API_TOKEN = os.environ.get('NG_API_TOKEN','')      # optional simple token

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def run(cmd):
    if isinstance(cmd, str):
        cmd = shlex.split(cmd)
    p = subprocess.run(['sudo'] + cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"cmd failed: {' '.join(cmd)}\nstdout:{p.stdout}\nstderr:{p.stderr}")
    return p.stdout

def read_state():
    if not os.path.exists(NET_STATE):
        return {'clients': {}}
    with open(NET_STATE, 'r') as f:
        return json.load(f)

@app.get("/clients")
def get_clients(request: Request):
    return read_state()

@app.get("/stream")
def stream():
    def iterfile():
        last = None
        while True:
            if os.path.exists(NET_STATE):
                try:
                    data = open(NET_STATE).read()
                    if data != last:
                        last = data
                        yield f"data: {data}\n\n"
                except Exception:
                    pass
            time.sleep(1)
    return StreamingResponse(iterfile(), media_type="text/event-stream")

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000)
