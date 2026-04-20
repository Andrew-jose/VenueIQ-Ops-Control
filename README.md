# VenueIQ: AI-Powered Crowd Orchestration Platform

VenueIQ is an advanced crowd management system for large-scale venues (stadiums, convention centres). It ingests real-time telemetry from Wi-Fi and POS systems, runs Spatio-Temporal Graph Attention Network (ST-GAT) predictions to anticipate bottlenecks, and uses Gemini 2.0 Flash to provide density-aware navigation for attendees — while giving operators simulation and notification tools to orchestrate crowd flow.

## 📸 System Overview

| Operator Control Room | Attendee App (PWA) | Notification & Simulation API |
| :---: | :---: | :---: |
| ![Ops Dashboard](./docs/screenshots/ops_dashboard.png) | ![Attendee App](./docs/screenshots/attendee_app.png) | ![Notification Service](./docs/screenshots/notification_service.png) |

---

## 🛠 Google Cloud Services

| Service | Role |
|---|---|
| **Cloud Run** | Hosts Ingestion, Prediction, and Notification microservices |
| **Cloud Pub/Sub** | `zone-events` topic with 7-day retention for high-throughput telemetry |
| **BigQuery** | `venue_analytics` dataset — `zone_density_stream` + `notification_log` tables |
| **Secret Manager** | Stores `FIREBASE_CREDENTIALS` and `GEMINI_API_KEY` |
| **Artifact Registry** | Hosts Docker images for all three services |
| **Gemini 2.0 Flash** | Powers intelligent routing advice in the attendee PWA |
| **Google Maps Platform** | Venue heatmap visualisation and attendee wayfinding |
| **Firebase Realtime DB** | Sub-second crowd density state sync across all devices |
| **Firebase Cloud Messaging** | Push notifications with exponential jitter batching |

---

## 🏗 System Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   Attendee PWA      │◄───►│   Ops Dashboard     │
│  (React/Vite)       │     │  (React/Vite)       │
└──────────┬──────────┘     └──────────┬──────────┘
           │  Real-time sync            │  Predictive views
           ▼                            ▼
┌──────────────────────────────────────────────────┐
│          Firebase Realtime Database              │
└──────────────────────┬───────────────────────────┘
                       ▲ density updates
┌──────────────────────┴───────────────────────────┐
│     ML Prediction Service (ST-GAT) — Cloud Run  │
└──────────────────────┬───────────────────────────┘
                       ▲ telemetry events (Pub/Sub)
┌──────────────────────┴───────────────────────────┐
│     Data Ingestion Service (FastAPI) — Cloud Run │
│     POS Webhooks · Ticket Scans · Wi-Fi Telemetry│
└──────────────────────────────────────────────────┘
          ▲                          ▲
┌─────────┴──────────┐   ┌──────────┴─────────────┐
│  google_pubsub     │   │  Notification Service  │
│  zone-events topic │   │  FCM + Simulator AI    │
└────────────────────┘   └────────────────────────┘
          ▲
┌─────────┴──────────────────────────────────────┐
│           BigQuery — venue_analytics           │
│  zone_density_stream  |  notification_log      │
└────────────────────────────────────────────────┘
```

---

## 🚀 Cloud Run Deployment (Production)

### Prerequisites
- GCP project with billing enabled
- `gcloud` CLI authenticated (`gcloud auth login`)
- Terraform ≥ 1.6 installed
- Docker installed and authenticated to Artifact Registry

### Step 1 — Build & push images

```bash
export PROJECT_ID=your-gcp-project-id
export REGION=us-central1
export REPO=venueiq-repo

# Create Artifact Registry repo (one-time)
gcloud artifacts repositories create $REPO \
  --repository-format=docker \
  --location=$REGION

# Authenticate Docker
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build and push each service
for SVC in ingestion prediction notification; do
  docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SVC}:latest \
    services/${SVC}
  docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SVC}:latest
done
```

### Step 2 — Store secrets

```bash
# Firebase service account JSON
gcloud secrets versions add FIREBASE_CREDENTIALS \
  --data-file=/path/to/firebase-credentials.json

# Gemini API key
echo -n "YOUR_GEMINI_API_KEY" | \
  gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

### Step 3 — Provision infrastructure

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — set project_id, region

terraform init
terraform plan
terraform apply
```

### Step 4 — Deploy

After `apply`, Terraform outputs the three Cloud Run URLs:

```
ingestion_service_url   = "https://venueiq-ingestion-xxxx.run.app"
prediction_service_url  = "https://venueiq-prediction-xxxx.run.app"
notification_service_url = "https://venueiq-notification-xxxx.run.app"
```

Set these in your frontend `.env.local` files:

```bash
# frontend/ops-dashboard/.env.local
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_DATABASE_URL=...

# frontend/attendee-app/.env.local
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_DATABASE_URL=...
VITE_MAPS_API_KEY=...
VITE_GEMINI_API_KEY=...
VITE_FCM_VAPID_KEY=...
```

---

## 💻 Local Development

```bash
cd venueiq
docker-compose up --build
```

| Service | Local URL |
|---|---|
| Ingestion | http://localhost:8001 |
| Prediction | http://localhost:8002 |
| Notification | http://localhost:8003 |

Run frontends with HMR:

```bash
# Ops dashboard
cd frontend/ops-dashboard && npm install && npm run dev   # → http://localhost:5173

# Attendee PWA
cd frontend/attendee-app && npm install && npm run dev    # → http://localhost:5174
```

---

## 🗂 Project Structure

```
venueiq/
├── services/
│   ├── ingestion/          # FastAPI — POS, ticket, Wi-Fi ingestion → Pub/Sub
│   ├── prediction/         # FastAPI — ST-GAT model inference
│   └── notification/       # FastAPI — FCM dispatch + What-If simulator
├── frontend/
│   ├── ops-dashboard/      # React/Vite — operator command centre
│   └── attendee-app/       # React/Vite PWA — attendee navigation
├── ml/
│   └── model/              # ST-GAT model definition and serving
├── infra/
│   └── terraform/          # GCP infrastructure as code
├── tests/                  # Integration tests
└── docs/
    └── screenshots/        # README assets
```

---

## 🔒 Security

- All secrets are stored in **GCP Secret Manager** — never in code or environment files committed to git
- `.env.local` files are **gitignored** — see `.env.local.example` in each frontend directory
- Cloud Run services run as a **non-root user** (`venueiq`)
- CORS origins are injected via the `CORS_ORIGINS` environment variable — set automatically by Terraform
- `terraform.tfvars` is **gitignored** — never committed

---


