# ST-GAT Crowd Density Predictor
FROM python:3.12-slim

# --- system deps for torch / pyg ---
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc g++ git curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- install Python requirements first (layer cache) ---
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- install PyG CPU-only wheels (avoids CUDA deps in slim image) ---
RUN pip install --no-cache-dir \
    torch_scatter torch_sparse torch_cluster torch_spline_conv \
    -f https://data.pyg.org/whl/torch-$(python -c "import torch; print(torch.__version__.split('+')[0])")+cpu.html \
    || true   # graceful: pyg 2.4+ bundles these via optional deps

# --- copy source ---
COPY . .

# --- train then serve ---
# If a pre-built model.pt is bind-mounted it will be used; otherwise train fresh.
CMD ["sh", "-c", "python train.py && uvicorn serve:app --host 0.0.0.0 --port 8001"]

EXPOSE 8001
