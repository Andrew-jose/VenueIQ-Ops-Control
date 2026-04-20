"""
Unit tests for the pure-PyTorch ST-GAT model.

Run:
    pytest tests/unit/test_model.py -v
"""

from __future__ import annotations

import sys
import os

ML_MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, ML_MODEL_DIR)

import numpy as np
import pytest
import torch

from model import (
    STGATModel, NODE_NAMES, NODE_IDS, EDGE_LIST, N_NODES,
    build_adjacency,
)
from dataset import (
    StadiumDataset, train_val_split,
    T_IN, H_OUT, N_FEAT,
)

# ── fixtures ──────────────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def adj() -> torch.Tensor:
    return build_adjacency(add_self_loops=True)


@pytest.fixture(scope="module")
def model(adj) -> STGATModel:
    m = STGATModel()
    m.eval()
    return m


@pytest.fixture(scope="module")
def ones_input(adj) -> tuple[torch.Tensor, torch.Tensor]:
    return torch.ones(N_NODES, T_IN, N_FEAT), adj


# ── test_output_shape ─────────────────────────────────────────────────────────
def test_output_shape(model, ones_input):
    """Unbatched forward must return [N=12, H=3]."""
    x, adj = ones_input
    with torch.no_grad():
        preds = model(x, adj)
    assert preds.shape == (12, 3), f"Expected (12, 3), got {tuple(preds.shape)}"


def test_output_shape_batched(model, adj):
    """Batched forward must return [B, N=12, H=3]."""
    B = 4
    x = torch.rand(B, N_NODES, T_IN, N_FEAT)
    with torch.no_grad():
        preds = model(x, adj)
    assert preds.shape == (B, 12, 3), f"Expected ({B}, 12, 3), got {tuple(preds.shape)}"


def test_output_range(model, ones_input):
    """All predicted densities must be in [0, 1] (sigmoid output)."""
    x, adj = ones_input
    with torch.no_grad():
        preds = model(x, adj)
    assert preds.min().item() >= 0.0 - 1e-6
    assert preds.max().item() <= 1.0 + 1e-6


# ── test_confidence_scoring ───────────────────────────────────────────────────
def _confidence(node_features, model_loaded=True):
    """Mirror of serve.py confidence logic."""
    if not model_loaded:
        return "low"
    arr = np.array(node_features, dtype=np.float32)
    non_zero = int(np.sum(arr.any(axis=0)))
    if non_zero == N_FEAT:
        return "high"
    if non_zero >= 2:
        return "medium"
    return "low"


def test_confidence_all_zeros():
    """All-zero features → 'low'."""
    feat = [[0.0, 0.0, 0.0]] * T_IN
    assert _confidence(feat) == "low"


def test_confidence_full_input():
    """All 3 feature channels present → 'high'."""
    feat = [[0.5, 0.3, 0.4]] * T_IN
    assert _confidence(feat) == "high"


def test_confidence_two_features():
    """Two non-zero channels → 'medium'."""
    feat = [[0.5, 0.3, 0.0]] * T_IN
    assert _confidence(feat) == "medium"


def test_confidence_model_not_loaded():
    """Model not loaded always → 'low', regardless of features."""
    feat = [[0.5, 0.3, 0.4]] * T_IN
    assert _confidence(feat, model_loaded=False) == "low"


# ── test_synthetic_data ────────────────────────────────────────────────────────
def test_synthetic_data_shapes():
    """StadiumDataset items must have correct tensor shapes."""
    ds = StadiumDataset(size=10)
    assert len(ds) == 10
    feat, adj_t, target = ds[0]
    assert feat.shape   == (N_NODES, T_IN, N_FEAT), f"feat: {feat.shape}"
    assert adj_t.shape  == (N_NODES, N_NODES),       f"adj:  {adj_t.shape}"
    assert target.shape == (N_NODES, H_OUT),          f"target: {target.shape}"


def test_synthetic_data_value_range():
    """All feature and target values must lie in [0, 1]."""
    ds = StadiumDataset(size=20)
    for i in range(len(ds)):
        feat, _, target = ds[i]
        assert feat.min().item()   >= -1e-3, f"feat min < 0 at {i}"
        assert feat.max().item()   <=  1.0 + 1e-3, f"feat max > 1 at {i}"
        assert target.min().item() >= -1e-3, f"target min < 0 at {i}"
        assert target.max().item() <=  1.0 + 1e-3, f"target max > 1 at {i}"


def test_train_val_split():
    """80/20 split must produce 800 train and 200 val indices."""
    _, train_idx, val_idx = train_val_split(size=1000, val_ratio=0.2)
    assert len(train_idx) == 800, f"Expected 800 train, got {len(train_idx)}"
    assert len(val_idx)   == 200, f"Expected 200 val, got {len(val_idx)}"


# ── test_edge_index / adjacency ───────────────────────────────────────────────
def test_edge_list_has_12_edges():
    """EDGE_LIST must contain exactly 12 directed edges per the spec."""
    assert len(EDGE_LIST) == 12, f"Expected 12, got {len(EDGE_LIST)}"


def test_adjacency_shape():
    """Adjacency matrix must be [12, 12]."""
    adj = build_adjacency()
    assert adj.shape == (12, 12), f"Expected (12, 12), got {adj.shape}"


def test_adjacency_symmetry():
    """Bidirectional edges make the adjacency matrix symmetric."""
    adj = build_adjacency(add_self_loops=False)
    assert torch.equal(adj, adj.T), "Adjacency matrix is not symmetric."


def test_specific_edges_in_adjacency():
    """Spot-check key edges from the spec are present."""
    adj = build_adjacency(add_self_loops=False)
    required = [
        ("gate_A1",    "concourse_N"),
        ("gate_B2",    "concourse_S"),
        ("concourse_E","zone_1"),
        ("concourse_W","zone_4"),
    ]
    for s_name, d_name in required:
        si, di = NODE_IDS[s_name], NODE_IDS[d_name]
        assert adj[si, di] == 1.0, f"Missing edge {s_name}→{d_name}"
        assert adj[di, si] == 1.0, f"Missing reverse edge {d_name}→{s_name}"


def test_node_count():
    """NODE_NAMES must list exactly 12 nodes."""
    assert len(NODE_NAMES) == 12
