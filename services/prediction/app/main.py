import os
import logging
import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="VenueIQ Prediction Service", version="1.0.0")

# ── CORS — allow Cloud Run service URLs + local dev ────────────────────────
# In production, restrict allow_origins to your actual Cloud Run URLs.
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


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "prediction",
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }


@app.get("/predict/{zone_id}")
def predict(zone_id: str):
    """
    Placeholder endpoint — replace with ST-GAT model inference.
    Returns a mock 30-minute density forecast for the given zone.
    """
    import random
    base = random.uniform(0.3, 0.8)
    forecast = [
        {"t": i * 5, "density": min(1.0, max(0.0, base + random.uniform(-0.1, 0.1)))}
        for i in range(7)
    ]
    return {
        "zone_id": zone_id,
        "forecast_minutes": 30,
        "model": "ST-GAT v1",
        "predictions": forecast,
        "generated_at": datetime.datetime.utcnow().isoformat(),
    }
