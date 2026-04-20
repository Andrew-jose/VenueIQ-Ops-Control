# ── Stage 1: dependency installation ──────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build tools
RUN pip install --upgrade pip

# Copy manifest first (layer cache optimisation)
COPY pyproject.toml ./

# Install into an isolated prefix so the layer is cacheable
RUN pip install --prefix=/install --no-cache-dir .

# ── Stage 2: lean runtime image ────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Non-root user for Cloud Run security best-practice
RUN addgroup --system venueiq && adduser --system --ingroup venueiq venueiq

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY app/ ./app/

# Cloud Run injects PORT env var; default to 8000 for local docker run
ENV PORT=8000

# Drop privileges
USER venueiq

# Use shell-form so $PORT is expanded at runtime
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1
