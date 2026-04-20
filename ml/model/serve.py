"""
FastAPI inference server for the ST-GAT crowd density model (pure PyTorch).

POST /predict    — run inference on 12-node feature input
GET  /model-info — graph topology + training metadata
GET  /health     — liveness

Run:
    uvicorn serve:app --host 0.0.0.0 --port 8001
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

import numpy as np
import torch
from fastapi import FastAPI
from pydantic import BaseModel, Field, field_validator

from model import STGATModel, NODE_NAMES, EDGE_LIST, build_adjacency

# ── constants ────────────────────────────────────────────────────────────────
CHECKPOINT_PATH = Path(os.getenv("MODEL_PT_PATH", "model.pt"))
N_NODES = 12
T_IN    = 6
N_FEAT  = 3
H_OUT   = 3

app_state: dict = {}


# ── lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    adj = build_adjacency(add_self_loops=True)
    try:
        model = STGATModel.load_checkpoint(CHECKPOINT_PATH)
        meta  = torch.load(CHECKPOINT_PATH, map_location="cpu", weights_only=False)
        app_state["last_trained"] = datetime.fromtimestamp(
            meta.get("saved_at", 0), tz=timezone.utc
        ).isoformat()
        app_state["model_loaded"] = True
    except FileNotFoundError:
        print(f"[serve] WARNING: {CHECKPOINT_PATH} not found — using random weights.")
        model = STGATModel()
        model.eval()
        app_state["last_trained"] = None
        app_state["model_loaded"] = False

    app_state["model"] = model
    app_state["adj"]   = adj
    yield
    app_state.clear()


# ── app ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="VenueIQ — ST-GAT Crowd Density Predictor",
    version="2.0.0",
    description="Pure-PyTorch Spatial-Temporal GAT for venue crowd density prediction.",
    lifespan=lifespan,
)


# ── schemas ───────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    features: list[list[list[float]]] = Field(
        ...,
        description="Shape [12][6][3] — density, velocity, transaction_rate per node per timestep.",
    )

    @field_validator("features")
    @classmethod
    def validate_shape(cls, v: list) -> list:
        if len(v) != N_NODES:
            raise ValueError(f"Expected {N_NODES} nodes, got {len(v)}.")
        for i, node_feat in enumerate(v):
            if len(node_feat) != T_IN:
                raise ValueError(f"Node {i}: expected {T_IN} timesteps, got {len(node_feat)}.")
            for t, step in enumerate(node_feat):
                if len(step) != N_FEAT:
                    raise ValueError(f"Node {i}, step {t}: expected {N_FEAT} features, got {len(step)}.")
        return v


class NodePrediction(BaseModel):
    node_id: int
    node_name: str
    predicted_density: list[float]
    confidence_score: Literal["high", "medium", "low"]


class PredictResponse(BaseModel):
    predictions: list[NodePrediction]


class ModelInfoResponse(BaseModel):
    nodes: list[dict]
    edges: list[dict]
    last_trained: str | None
    model_loaded: bool


# ── confidence scoring ────────────────────────────────────────────────────────
def _confidence(
    node_features: list[list[float]], model_loaded: bool
) -> Literal["high", "medium", "low"]:
    if not model_loaded:
        return "low"
    arr = np.array(node_features, dtype=np.float32)  # [T, F]
    non_zero = int(np.sum(arr.any(axis=0)))           # channels with ≥1 non-zero value
    if non_zero == N_FEAT:
        return "high"
    if non_zero >= 2:
        return "medium"
    return "low"


# ── routes ────────────────────────────────────────────────────────────────────
@app.post("/predict", response_model=PredictResponse)
async def predict(body: PredictRequest) -> PredictResponse:
    model: STGATModel    = app_state["model"]
    adj: torch.Tensor    = app_state["adj"]
    model_loaded: bool   = app_state["model_loaded"]

    feat_np = np.array(body.features, dtype=np.float32)  # [12, 6, 3]
    x       = torch.from_numpy(feat_np)                   # [N, T, F]

    with torch.no_grad():
        preds = model(x, adj)                             # [N, H]

    preds_np = preds.numpy()

    results = [
        NodePrediction(
            node_id=n,
            node_name=NODE_NAMES[n],
            predicted_density=[round(float(preds_np[n, h]), 4) for h in range(H_OUT)],
            confidence_score=_confidence(body.features[n], model_loaded),
        )
        for n in range(N_NODES)
    ]
    return PredictResponse(predictions=results)


@app.get("/model-info", response_model=ModelInfoResponse)
async def model_info() -> ModelInfoResponse:
    return ModelInfoResponse(
        nodes=[{"id": i, "name": n} for i, n in enumerate(NODE_NAMES)],
        edges=[{"source": s, "target": t} for s, t in EDGE_LIST],
        last_trained=app_state.get("last_trained"),
        model_loaded=app_state.get("model_loaded", False),
    )


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "timestamp": datetime.now(tz=timezone.utc).isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("serve:app", host="0.0.0.0", port=8001, reload=False)
