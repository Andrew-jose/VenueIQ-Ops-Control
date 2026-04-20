import os
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from app.models import AlertRequest, NotifyRequest, WhatIfRequest
from app.notifier import send_targeted_notification
from app.simulator import run_whatif
import datetime

app = FastAPI(title="VenueIQ Notification Service")

# ── CORS — reads from env var so Cloud Run URLs are allowed automatically ──
# Set CORS_ORIGINS in Terraform cloudrun.tf or .env for local dev.
# Example: "https://venueiq-ops-xxxx.run.app,http://localhost:5173"
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/", response_class=HTMLResponse)
def root():
    return """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VenueIQ Notification Service</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #080C0E;
      color: #F0F4F5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container { max-width: 680px; width: 100%; }
    .header { margin-bottom: 2.5rem; }
    .logo-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .logo-icon {
      width: 44px; height: 44px;
      background: #F59E0B;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.15);
    }
    h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.04em;
      color: #F0F4F5;
    }
    .subtitle {
      font-size: 15px;
      color: #6B8A8D;
      margin-top: 6px;
      letter-spacing: -0.01em;
    }
    .status-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 20px;
      padding: 10px 16px;
      background: #0F1A1C;
      border: 1px solid #1A2E30;
      border-radius: 12px;
      font-size: 13px;
      color: #F59E0B;
      font-weight: 600;
    }
    .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #10B981;
      animation: pulse 2s infinite;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.2); }
    }
    .endpoints { display: flex; flex-direction: column; gap: 12px; }
    .endpoint {
      background: #0F1A1C;
      border: 1px solid #1A2E30;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      transition: all 0.2s;
    }
    .endpoint:hover { 
      border-color: #F59E0B; 
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .method {
      font-size: 10px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 8px;
      letter-spacing: 0.08em;
      white-space: nowrap;
      margin-top: 2px;
    }
    .post { background: #1A1208; color: #F59E0B; }
    .get  { background: #0A1A12; color: #10B981; }
    .path {
      font-size: 15px;
      font-weight: 700;
      color: #F0F4F5;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }
    .desc { font-size: 13px; color: #6B8A8D; line-height: 1.6; }
    .tag {
      display: inline-block;
      font-size: 9px;
      font-weight: 800;
      padding: 3px 9px;
      border-radius: 20px;
      background: #152124;
      color: #F59E0B;
      margin-top: 10px;
      letter-spacing: 0.06em;
      border: 1px solid #1A2E30;
    }
    .footer {
      margin-top: 3rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1.5rem;
      border-top: 1px solid #1A2E30;
      width: 100%;
    }
    .footer-links { display: flex; gap: 20px; }
    .footer-links a {
      font-size: 13px;
      color: #F59E0B;
      text-decoration: none;
      font-weight: 700;
      transition: color 0.2s;
    }
    .footer-links a:hover { color: #FB923C; }
    .version {
      font-size: 11px;
      color: #2A4A4D;
      font-family: monospace;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-row">
        <div class="logo-icon">🔔</div>
        <h1>VenueIQ</h1>
      </div>
      <p class="subtitle">
        Thermal Intelligence Engine — 
        Real-time crowd orchestration & AI-driven simulation
      </p>
      <div class="status-bar">
        <div class="dot"></div>
        All systems operational &nbsp;·&nbsp; 
        Port 8002 &nbsp;·&nbsp; 
        FastAPI + Uvicorn
      </div>
    </div>

    <div class="endpoints">
      <div class="endpoint">
        <span class="method get">GET</span>
        <div>
          <div class="path">/health</div>
          <div class="desc">Service health check. Returns status, 
          service name and UTC timestamp.</div>
          <span class="tag">MONITORING</span>
        </div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <div>
          <div class="path">/notify/alert</div>
          <div class="desc">Dispatch a targeted staff alert to a 
          specific zone. Uses exponential jitter batching to prevent 
          FCM network storms.</div>
          <span class="tag">NOTIFICATIONS</span>
        </div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <div>
          <div class="path">/notify/crowd-balance</div>
          <div class="desc">Send a crowd redistribution notification 
          with an optional discount incentive. Targets attendees 
          near overcrowded zones.</div>
          <span class="tag">NOTIFICATIONS</span>
        </div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <div>
          <div class="path">/simulator/whatif</div>
          <div class="desc">Run a predictive simulation: estimate 
          crowd clear time given redirection or staffing strategies.</div>
          <span class="tag">AI SIMULATION</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-links">
        <a href="/docs">Interactive Docs →</a>
        <a href="/health">Health Check →</a>
      </div>
      <span class="version">v1.1.0 · VenueIQ Thermal Stack</span>
    </div>
  </div>
</body>
</html>
"""

@app.get("/health")
def health():
    return {"status": "ok", 
            "service": "notification",
            "timestamp": datetime.datetime.utcnow().isoformat()}

@app.post("/notify/alert")
async def staff_alert(req: AlertRequest, 
                      background_tasks: BackgroundTasks):
    background_tasks.add_task(
        send_targeted_notification,
        zone_id=req.zone_id,
        message=req.message,
        notification_type="staff_alert"
    )
    return {
        "status": "queued",
        "zone_id": req.zone_id,
        "message": req.message,
        "queued_at": datetime.datetime.utcnow().isoformat()
    }

@app.post("/notify/crowd-balance")
async def crowd_balance(req: NotifyRequest,
                        background_tasks: BackgroundTasks):
    background_tasks.add_task(
        send_targeted_notification,
        zone_id=req.zone_id,
        message=req.message,
        notification_type="crowd_redirect",
        discount_code=req.discount_code
    )
    return {
        "status": "queued",
        "estimated_recipients": req.estimated_recipients,
        "discount_code": req.discount_code
    }

@app.post("/simulator/whatif")
def whatif(req: WhatIfRequest):
    return run_whatif(req.zone_id, req.action, req.value)

# Startup log — uses logger (visible in Cloud Run logs, not stdout noise)
import logging as _logging
_logging.getLogger(__name__).info("VenueIQ Notification Service started — docs at /docs")
