# ---------------------------------------------------------------------------
# Secret Manager: FIREBASE_CREDENTIALS
# ---------------------------------------------------------------------------
resource "google_secret_manager_secret" "firebase_credentials" {
  secret_id = "FIREBASE_CREDENTIALS"
  project   = var.project_id

  labels = {
    app = "venueiq"
    env = "production"
  }

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

# ---------------------------------------------------------------------------
# Secret Manager: GEMINI_API_KEY
# ---------------------------------------------------------------------------
resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "GEMINI_API_KEY"
  project   = var.project_id

  labels = {
    app = "venueiq"
    env = "production"
  }

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

# ---------------------------------------------------------------------------
# NOTE: Secret *versions* (the actual secret values) are NOT managed here
# to prevent sensitive data from being stored in Terraform state.
#
# To add a secret value, run:
#   gcloud secrets versions add FIREBASE_CREDENTIALS \
#       --data-file=/path/to/firebase-credentials.json
#
#   echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY \
#       --data-file=-
# ---------------------------------------------------------------------------
