"""
Spatial-Temporal Graph Attention Network (ST-GAT) — pure PyTorch, no torch-geometric.

Architecture
------------
1. input_proj  : Linear(F=3 → hidden_dim=32)
2. ManualGATLayer : multi-head attention guided by adjacency matrix
3. LSTM(32 → 64, layers=2) over the T=6 time dimension per node
4. output_proj : Linear(64 → H=3)  +  Sigmoid (densities ∈ [0,1])

Inputs
------
x   : FloatTensor [N, T, F]   (N=12, T=6, F=3)
adj : FloatTensor [N, N]      (binary/soft adjacency, self-loops included)

Output
------
preds : FloatTensor [N, H=3]
"""

from __future__ import annotations

import time
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
import torch.nn.functional as F

# ── graph constants ─────────────────────────────────────────────────────────
NODE_NAMES: list[str] = [
    "gate_A1",    "gate_A2",    "gate_B1",    "gate_B2",
    "concourse_N","concourse_S","concourse_E","concourse_W",
    "zone_1",     "zone_2",     "zone_3",     "zone_4",
]
NODE_IDS: dict[str, int] = {n: i for i, n in enumerate(NODE_NAMES)}

EDGE_LIST: list[tuple[str, str]] = [
    ("gate_A1",    "concourse_N"),
    ("gate_A2",    "concourse_N"),
    ("gate_B1",    "concourse_S"),
    ("gate_B2",    "concourse_S"),
    ("concourse_N","concourse_E"),
    ("concourse_N","concourse_W"),
    ("concourse_S","concourse_E"),
    ("concourse_S","concourse_W"),
    ("concourse_E","zone_1"),
    ("concourse_E","zone_2"),
    ("concourse_W","zone_3"),
    ("concourse_W","zone_4"),
]

N_NODES = 12


def build_adjacency(add_self_loops: bool = True) -> torch.Tensor:
    """Return a [12, 12] float adjacency matrix (bidirectional + optional self-loops)."""
    adj = torch.zeros(N_NODES, N_NODES)
    for s, d in EDGE_LIST:
        si, di = NODE_IDS[s], NODE_IDS[d]
        adj[si, di] = 1.0
        adj[di, si] = 1.0   # undirected / bidirectional
    if add_self_loops:
        adj.fill_diagonal_(1.0)
    return adj


# ── manual multi-head GAT layer ──────────────────────────────────────────────
class ManualGATLayer(nn.Module):
    """
    Multi-head graph attention layer.

    Each head learns:
      e_ij = LeakyReLU( a_h^T [ W_h h_i || W_h h_j ] )
    Scores are masked by the adjacency matrix before softmax.

    Parameters
    ----------
    in_dim   : input feature dimension per node
    out_dim  : output feature dimension per node (same for all heads)
    num_heads: number of attention heads (outputs are averaged, not concatenated,
               so the output dim stays = out_dim regardless of num_heads)
    dropout  : attention-weight dropout
    """

    def __init__(
        self,
        in_dim: int,
        out_dim: int,
        num_heads: int = 4,
        dropout: float = 0.1,
        negative_slope: float = 0.2,
    ) -> None:
        super().__init__()
        self.num_heads = num_heads
        self.out_dim   = out_dim
        self.dropout   = dropout

        # One linear projection per head: in_dim → out_dim
        self.W = nn.ModuleList([
            nn.Linear(in_dim, out_dim, bias=False) for _ in range(num_heads)
        ])
        # Attention vector per head: 2*out_dim → 1
        self.a = nn.ParameterList([
            nn.Parameter(torch.empty(2 * out_dim)) for _ in range(num_heads)
        ])
        self.leaky = nn.LeakyReLU(negative_slope)
        self.drop  = nn.Dropout(dropout)

        self._init_weights()

    def _init_weights(self) -> None:
        for lin in self.W:
            nn.init.xavier_uniform_(lin.weight.unsqueeze(0))
        for a in self.a:
            nn.init.xavier_uniform_(a.unsqueeze(0))

    def forward(self, h: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        """
        Fully vectorised — no Python loops over N.

        h   : [..., N, in_dim]  (supports extra leading batch/time dims)
        adj : [N, N]
        returns [..., N, out_dim]
        """
        leading = h.shape[:-2]
        N       = h.shape[-2]
        head_outputs = []

        for k in range(self.num_heads):
            Wh  = self.W[k](h)                            # [..., N, out_dim]
            a_k = self.a[k]                               # [2*out_dim]
            D   = Wh.shape[-1]

            # [..., N, 1, D] vs [..., 1, N, D]  →  [..., N, N, 2D]
            Wh_i   = Wh.unsqueeze(-2).expand(*leading, N, N, D)
            Wh_j   = Wh.unsqueeze(-3).expand(*leading, N, N, D)
            concat = torch.cat([Wh_i, Wh_j], dim=-1)     # [..., N, N, 2D]

            e      = self.leaky((concat * a_k).sum(-1))  # [..., N, N]

            # mask non-edges — expand [N,N] mask to match any leading dims
            mask = (adj == 0)
            for _ in range(e.dim() - mask.dim()):
                mask = mask.unsqueeze(0)
            mask = mask.expand_as(e)
            e    = e.masked_fill(mask, float("-inf"))

            alpha = F.softmax(e, dim=-1)
            alpha = torch.nan_to_num(alpha, nan=0.0)
            alpha = self.drop(alpha)

            out = alpha @ Wh                              # [..., N, out_dim]
            head_outputs.append(out)

        return torch.stack(head_outputs, dim=0).mean(dim=0)  # [..., N, out_dim]


# ── ST-GAT model ─────────────────────────────────────────────────────────────
class STGATModel(nn.Module):
    """
    Parameters
    ----------
    in_features : F = 3
    hidden_dim  : 32
    num_heads   : 4
    lstm_hidden : 64
    lstm_layers : 2
    num_nodes   : 12
    timesteps   : T = 6
    horizon     : H = 3
    """

    def __init__(
        self,
        in_features: int = 3,
        hidden_dim: int = 32,
        num_heads: int = 4,
        lstm_hidden: int = 64,
        lstm_layers: int = 2,
        num_nodes: int = 12,
        timesteps: int = 6,
        horizon: int = 3,
    ) -> None:
        super().__init__()
        self.num_nodes   = num_nodes
        self.timesteps   = timesteps
        self.horizon     = horizon
        self.hidden_dim  = hidden_dim
        self.lstm_hidden = lstm_hidden
        self.lstm_layers = lstm_layers

        self.input_proj = nn.Linear(in_features, hidden_dim)
        self.gat        = ManualGATLayer(hidden_dim, hidden_dim, num_heads=num_heads)
        self.lstm       = nn.LSTM(
            input_size=hidden_dim,
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            batch_first=True,
            dropout=0.1 if lstm_layers > 1 else 0.0,
        )
        self.output_proj = nn.Sequential(
            nn.Linear(lstm_hidden, horizon),
            nn.Sigmoid(),
        )
        self._init_weights()

    def _init_weights(self) -> None:
        nn.init.xavier_uniform_(self.input_proj.weight)
        nn.init.zeros_(self.input_proj.bias)
        nn.init.xavier_uniform_(self.output_proj[0].weight)
        nn.init.zeros_(self.output_proj[0].bias)
        for name, p in self.lstm.named_parameters():
            if "weight" in name:
                nn.init.orthogonal_(p)
            elif "bias" in name:
                nn.init.zeros_(p)

    # ── forward ──────────────────────────────────────────────────────────────
    def forward(
        self,
        x: torch.Tensor,    # [N, T, F]  or  [B, N, T, F]
        adj: torch.Tensor,  # [N, N]
    ) -> torch.Tensor:
        """
        Fully vectorized forward — no Python loops over B or T.
        Returns [N, H] (unbatched) or [B, N, H] (batched).
        """
        batched = x.dim() == 4
        if not batched:
            x = x.unsqueeze(0)            # → [1, N, T, F]

        B, N, T, F_in = x.shape

        # Step 1 — project all features at once: [B, N, T, hidden_dim]
        x_proj = self.input_proj(x)

        # Step 2 — vectorized GAT over [B, N, T, hidden_dim]
        # ManualGATLayer.forward supports arbitrary leading dims [..., N, D]
        # We pass [B, T, N, D] so the leading dims are (B, T) and N is second-to-last.
        x_bt = x_proj.permute(0, 2, 1, 3)          # [B, T, N, hidden_dim]
        gat_bt = self.gat(x_bt, adj)               # [B, T, N, hidden_dim]
        gat_out = gat_bt.permute(0, 2, 1, 3)       # [B, N, T, hidden_dim]

        # Step 3 — temporal LSTM: reshape to [B*N, T, hidden_dim]
        lstm_in  = gat_out.reshape(B * N, T, self.hidden_dim)
        lstm_out, _ = self.lstm(lstm_in)            # [B*N, T, lstm_hidden]
        last = lstm_out[:, -1, :]                   # [B*N, lstm_hidden]

        # Step 4 — output projection
        preds = self.output_proj(last)              # [B*N, H]
        preds = preds.view(B, N, self.horizon)

        return preds.squeeze(0) if not batched else preds

    # ── checkpoint helpers ────────────────────────────────────────────────────
    def save_checkpoint(
        self,
        path: str | Path = "model.pt",
        extra_meta: Optional[dict] = None,
    ) -> None:
        path = Path(path)
        torch.save(
            {
                "model_state_dict": self.state_dict(),
                "model_config": {
                    "in_features": self.input_proj.in_features,
                    "hidden_dim":  self.hidden_dim,
                    "num_heads":   self.gat.num_heads,
                    "lstm_hidden": self.lstm_hidden,
                    "lstm_layers": self.lstm_layers,
                    "num_nodes":   self.num_nodes,
                    "timesteps":   self.timesteps,
                    "horizon":     self.horizon,
                },
                "saved_at": time.time(),
                **(extra_meta or {}),
            },
            path,
        )
        print(f"[STGATModel] Checkpoint saved → {path}")

    @classmethod
    def load_checkpoint(
        cls,
        path: str | Path = "model.pt",
        map_location: str = "cpu",
    ) -> "STGATModel":
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"Checkpoint not found: {path}")
        payload = torch.load(path, map_location=map_location, weights_only=False)
        model = cls(**payload["model_config"])
        model.load_state_dict(payload["model_state_dict"])
        model.eval()
        print(f"[STGATModel] Loaded checkpoint from {path}")
        return model
