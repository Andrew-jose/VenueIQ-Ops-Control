# ── Stage 1: dependency installation ──────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

RUN pip install --upgrade pip

COPY pyproject.toml ./
RUN pip install --prefix=/install --no-cache-dir .

# ── Stage 2: lean runtime image ────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

RUN addgroup --system venueiq && adduser --system --ingroup venueiq venueiq

COPY --from=builder /install /usr/local

COPY app/ ./app/

ENV PORT=8000

USER venueiq

CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1
