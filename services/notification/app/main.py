from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from app.models import AlertRequest, NotifyRequest, WhatIfRequest
from app.notifier import send_targeted_notification
from app.simulator import run_whatif
import datetime

app = FastAPI(title="VenueIQ Notification Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", 
                   "http://localhost:5174"],
    allow_methods=["*"],
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
      background: #0F172A;
      color: #E2E8F0;
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
      width: 40px; height: 40px;
      background: #3B82F6;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.04em;
      color: #F8FAFC;
    }
    .subtitle {
      font-size: 15px;
      color: #64748B;
      margin-top: 6px;
      letter-spacing: -0.01em;
    }
    .status-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 10px 14px;
      background: #0D2137;
      border: 1px solid #1E3A5F;
      border-radius: 10px;
      font-size: 13px;
      color: #38BDF8;
    }
    .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #22C55E;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .endpoints { display: flex; flex-direction: column; gap: 10px; }
    .endpoint {
      background: #1E293B;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px 18px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      transition: border-color 0.2s;
    }
    .endpoint:hover { border-color: #3B82F6; }
    .method {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.05em;
      white-space: nowrap;
      margin-top: 2px;
    }
    .post { background: #1D4ED8; color: #BFDBFE; }
    .get  { background: #065F46; color: #A7F3D0; }
    .path {
      font-size: 14px;
      font-weight: 600;
      color: #F1F5F9;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }
    .desc { font-size: 13px; color: #64748B; line-height: 1.5; }
    .tag {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 20px;
      background: #1E3A5F;
      color: #38BDF8;
      margin-top: 6px;
      letter-spacing: 0.04em;
    }
    .footer {
      margin-top: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1.5rem;
      border-top: 1px solid #1E293B;
    }
    .footer-links { display: flex; gap: 16px; }
    .footer-links a {
      font-size: 13px;
      color: #3B82F6;
      text-decoration: none;
      font-weight: 500;
    }
    .footer-links a:hover { color: #60A5FA; }
    .version {
      font-size: 12px;
      color: #475569;
      font-family: monospace;
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
        Notification &amp; Simulation Microservice — 
        Real-time crowd orchestration for large-scale venues
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
          FCM network storms across 60K+ devices.</div>
          <span class="tag">NOTIFICATIONS</span>
        </div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <div>
          <div class="path">/notify/crowd-balance</div>
          <div class="desc">Send a crowd redistribution notification 
          with an optional discount incentive. Targets attendees 
          near an overcrowded zone who haven't visited recently.</div>
          <span class="tag">NOTIFICATIONS</span>
        </div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <div>
          <div class="path">/simulator/whatif</div>
          <div class="desc">Run a predictive simulation: estimate 
          crowd clear time given a redirect percentage or staff 
          addition. Returns severity, color coding and 
          ±2 min confidence interval.</div>
          <span class="tag">AI SIMULATION</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-links">
        <a href="/docs">Interactive Docs →</a>
        <a href="/health">Health Check →</a>
      </div>
      <span class="version">v1.0.0 · VenueIQ Platform</span>
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

print("""
+--------------------------------------+
|   VenueIQ Notification Service       |
|   Running on http://localhost:8002   |
|   Docs: http://localhost:8002/docs   |
+--------------------------------------+
""")
