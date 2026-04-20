# ---------------------------------------------------------------------------
# Service Account
# ---------------------------------------------------------------------------
resource "google_service_account" "venueiq_sa" {
  account_id   = "venueiq-sa"
  display_name = "VenueIQ Service Account"
  description  = "Used by all VenueIQ Cloud Run services."
  project      = var.project_id

  depends_on = [google_project_service.apis]
}

# ---------------------------------------------------------------------------
# IAM Role Bindings for venueiq-sa
# ---------------------------------------------------------------------------
locals {
  sa_roles = [
    "roles/pubsub.publisher",
    "roles/bigquery.dataEditor",
    "roles/bigquery.jobUser",        # required to actually run BQ jobs
    "roles/run.invoker",
    "roles/firebase.sdkAdminServiceAgent",
    "roles/secretmanager.secretAccessor", # read secrets at runtime
  ]
}

resource "google_project_iam_member" "venueiq_sa_roles" {
  for_each = toset(local.sa_roles)

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.venueiq_sa.email}"
}
