"""
StadiumDataset — synthetic crowd-flow data (pure PyTorch, no torch-geometric).

Each item: (features [N,T,F], adj [N,N], targets [N,H])
  N=12 nodes, T=6 input timesteps, F=3 features, H=3 prediction horizon.

Synthetic rules
---------------
1. Sine-wave base: crowd builds before event, peaks at halftime, drops after.
2. Gate nodes lead concourse nodes by 1 timestep (realistic ingress flow).
3. 10 % chance any zone node spikes +0.4 for 2-3 timesteps (random surge).
4. Velocity ≈ |Δdensity|; transaction_rate ≈ 0.8*density + U(0, 0.2).
"""

from __future__ import annotations

import math
import numpy as np
import torch
from torch.utils.data import Dataset

from model import (
    NODE_NAMES, NODE_IDS, EDGE_LIST, N_NODES, build_adjacency
)

# ── constants ────────────────────────────────────────────────────────────────
T_IN      = 6
H_OUT     = 3
N_FEAT    = 3
N_SAMPLES = 1000

GATE_IDX      = [NODE_IDS[n] for n in ["gate_A1","gate_A2","gate_B1","gate_B2"]]
CONCOURSE_IDX = [NODE_IDS[n] for n in ["concourse_N","concourse_S","concourse_E","concourse_W"]]
ZONE_IDX      = [NODE_IDS[n] for n in ["zone_1","zone_2","zone_3","zone_4"]]

# ── helpers ──────────────────────────────────────────────────────────────────
def _node_type(idx: int) -> str:
    if idx in GATE_IDX:      return "gate"
    if idx in CONCOURSE_IDX: return "concourse"
    return "zone"

def _base_density(phase: float, ntype: str) -> float:
    raw = 0.5 + 0.45 * math.sin(phase - math.pi / 2)
    scale = {"gate": 1.1, "concourse": 1.0, "zone": 0.9}[ntype]
    return max(0.0, min(1.0, raw * scale))

def _event_phase(sample_idx: int, total: int = N_SAMPLES) -> float:
    return (sample_idx / total) * 2 * math.pi

def _generate_timeline(sample_idx: int, rng: np.random.Generator) -> np.ndarray:
    """Return density [N, T_IN+H_OUT]."""
    total_steps = T_IN + H_OUT
    base_phase  = _event_phase(sample_idx)

    density = np.zeros((N_NODES, total_steps), dtype=np.float32)
    for n in range(N_NODES):
        ntype = _node_type(n)
        for t in range(total_steps):
            phase_t = base_phase + (t / total_steps) * 0.3
            density[n, t] = _base_density(phase_t, ntype)
        density[n] += rng.normal(0, 0.03, total_steps).astype(np.float32)
        density[n]  = np.clip(density[n], 0.0, 1.0)

    # gate leads concourse by 1 step
    for g in GATE_IDX:
        density[g] = np.roll(density[g], -1)
        density[g, -1] = density[g, -2]

    # random zone surges
    for z in ZONE_IDX:
        if rng.random() < 0.1:
            length = int(rng.integers(2, 4))
            start  = int(rng.integers(0, total_steps - length + 1))
            density[z, start:start+length] = np.clip(
                density[z, start:start+length] + 0.4, 0.0, 1.0
            )

    return density


# ── dataset ──────────────────────────────────────────────────────────────────
class StadiumDataset(Dataset):
    """
    Generates *size* synthetic samples and caches them in RAM.

    Returns (features [N,T,F], adj [N,N], targets [N,H]).
    """

    def __init__(self, size: int = N_SAMPLES, seed: int = 42) -> None:
        super().__init__()
        self.adj = build_adjacency(add_self_loops=True)   # shared [N,N]

        rng = np.random.default_rng(seed)
        self.samples: list[tuple[torch.Tensor, torch.Tensor, torch.Tensor]] = []

        for i in range(size):
            d = _generate_timeline(i, rng)        # [N, T+H]
            d_in  = d[:, :T_IN]                   # [N, T]
            d_out = d[:, T_IN:]                   # [N, H]

            velocity = np.abs(np.diff(d_in, axis=1, prepend=d_in[:, :1]))
            velocity = np.clip(velocity, 0.0, 1.0).astype(np.float32)

            tx_rate  = np.clip(d_in * 0.8 + rng.uniform(0, 0.2, d_in.shape), 0.0, 1.0).astype(np.float32)

            feat = np.stack([d_in, velocity, tx_rate], axis=-1)  # [N, T, F]

            self.samples.append((
                torch.from_numpy(feat),             # [N, T, F]
                self.adj,                           # [N, N]
                torch.from_numpy(d_out),            # [N, H]
            ))

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        return self.samples[idx]


# ── train / val split ─────────────────────────────────────────────────────────
def train_val_split(
    size: int = N_SAMPLES,
    val_ratio: float = 0.2,
    seed: int = 42,
) -> tuple[StadiumDataset, list[int], list[int]]:
    """
    Returns (dataset, train_indices, val_indices).
    Keeps temporal ordering (first 80 % = train, last 20 % = val).
    """
    ds      = StadiumDataset(size=size, seed=seed)
    n_val   = int(size * val_ratio)   # 200
    n_train = size - n_val            # 800
    return ds, list(range(n_train)), list(range(n_train, size))
