"""
Lightweight training script — pure PyTorch, no DataLoader needed.
Target: under 60 seconds on CPU for 20 epochs over 800 samples (batch=16).

Usage:
    python train.py
"""

from __future__ import annotations

import time
import random

import torch
import torch.nn as nn

from dataset import train_val_split
from model import STGATModel

# ── hyper-parameters ─────────────────────────────────────────────────────────
EPOCHS      = 20
BATCH_SIZE  = 16
LR          = 1e-3
LOG_EVERY   = 5
CHECKPOINT  = "model.pt"
SEED        = 42
# ─────────────────────────────────────────────────────────────────────────────

torch.manual_seed(SEED)
random.seed(SEED)

def main() -> None:
    device = torch.device("cpu")   # CPU only for speed
    print(f"[train] device: {device}")

    # ── data ─────────────────────────────────────────────────────────────────
    print("[train] Generating synthetic dataset …")
    t_data = time.time()
    ds, train_idx, val_idx = train_val_split()
    print(
        f"[train] Dataset ready in {time.time()-t_data:.1f}s  "
        f"| train={len(train_idx)}  val={len(val_idx)}"
    )

    # Pre-fetch all tensors (already in RAM), move adj once
    adj = ds[0][1].to(device)   # [N, N] — same for all samples

    def get_batch(indices: list[int], start: int) -> tuple[torch.Tensor, torch.Tensor]:
        batch_idx = indices[start: start + BATCH_SIZE]
        feats   = torch.stack([ds[i][0] for i in batch_idx]).to(device)  # [B,N,T,F]
        targets = torch.stack([ds[i][2] for i in batch_idx]).to(device)  # [B,N,H]
        return feats, targets

    # ── model ─────────────────────────────────────────────────────────────────
    model     = STGATModel().to(device)
    n_params  = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[train] Parameters: {n_params:,}")

    optimizer = torch.optim.Adam(model.parameters(), lr=LR)
    criterion = nn.MSELoss()

    # ── training loop ─────────────────────────────────────────────────────────
    best_val_loss = float("inf")
    t0 = time.time()

    header = f"{'Epoch':>6} | {'Train Loss':>12} | {'Val Loss':>12} | {'Elapsed':>9}"
    print(f"\n{header}")
    print("─" * len(header))

    for epoch in range(1, EPOCHS + 1):
        model.train()

        # shuffle training indices each epoch
        shuffled = train_idx.copy()
        random.shuffle(shuffled)

        train_loss_sum = 0.0
        n_train_batches = 0

        for start in range(0, len(shuffled), BATCH_SIZE):
            feats, targets = get_batch(shuffled, start)

            optimizer.zero_grad()
            preds = model(feats, adj)          # [B, N, H]
            loss  = criterion(preds, targets)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()

            train_loss_sum  += loss.item()
            n_train_batches += 1

        avg_train = train_loss_sum / n_train_batches

        # ── validation (no grad) ──────────────────────────────────────────────
        model.eval()
        val_loss_sum = 0.0
        n_val_batches = 0
        with torch.no_grad():
            for start in range(0, len(val_idx), BATCH_SIZE):
                feats, targets = get_batch(val_idx, start)
                preds = model(feats, adj)
                val_loss_sum  += criterion(preds, targets).item()
                n_val_batches += 1

        avg_val = val_loss_sum / n_val_batches

        if avg_val < best_val_loss:
            best_val_loss = avg_val
            model.save_checkpoint(
                CHECKPOINT,
                extra_meta={"epoch": epoch, "val_loss": avg_val, "train_loss": avg_train},
            )

        if epoch % LOG_EVERY == 0 or epoch == 1:
            elapsed = time.time() - t0
            print(f"{epoch:>6} | {avg_train:>12.6f} | {avg_val:>12.6f} | {elapsed:>8.1f}s")

    total = time.time() - t0
    print("─" * len(header))
    print(
        f"[train] Finished {EPOCHS} epochs in {total:.1f}s "
        f"| best val loss: {best_val_loss:.6f} | saved → {CHECKPOINT}"
    )


if __name__ == "__main__":
    main()
