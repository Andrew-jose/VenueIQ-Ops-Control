# ---------------------------------------------------------------------------
# Cloud Run Services (ingestion, prediction, notification)
# ---------------------------------------------------------------------------

locals {
  # Base Artifact Registry image path (without the service name / tag)
  ar_base = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repo}"
}

resource "google_cloud_run_service" "venueiq_services" {
  for_each = var.services

  name     = "venueiq-${each.key}"
  location = var.region
  project  = var.project_id

  metadata {
    labels = {
      app     = "venueiq"
      service = each.key
      env     = "production"
    }
    annotations = {
      # Terraform managed — do not edit manually
      "run.googleapis.com/ingress" = "all"
    }
  }

  template {
    metadata {
      annotations = {
        # Auto-scaling bounds
        "autoscaling.knative.dev/minScale" = tostring(each.value.min_instances)
        "autoscaling.knative.dev/maxScale" = tostring(each.value.max_instances)
        # Always use latest revision when image changes
        "run.googleapis.com/client-name" = "terraform"
      }
    }

    spec {
      service_account_name = google_service_account.venueiq_sa.email
      container_concurrency = 80
      timeout_seconds       = 300

      containers {
        image = "${local.ar_base}/${each.key}:${each.value.image_tag}"

        resources {
          limits = {
            memory = each.value.memory
            cpu    = each.value.cpu
          }
        }

        # ── Common environment variables ──────────────────────────────────
        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }
        env {
          name  = "GCP_REGION"
          value = var.region
        }
        env {
          name  = "PUBSUB_TOPIC"
          value = google_pubsub_topic.zone_events.name
        }
        env {
          name  = "BQ_DATASET"
          value = google_bigquery_dataset.venue_analytics.dataset_id
        }
        env {
          name  = "BQ_DENSITY_TABLE"
          value = google_bigquery_table.zone_density_stream.table_id
        }
        env {
          name  = "BQ_NOTIFICATION_TABLE"
          value = google_bigquery_table.notification_log.table_id
        }

        # ── Secret-backed environment variables ───────────────────────────
        env {
          name = "FIREBASE_CREDENTIALS"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.firebase_credentials.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "GEMINI_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.gemini_api_key.secret_id
              key  = "latest"
            }
          }
        }

        # ── CORS — allows sibling Cloud Run services to call each other ───
        # Each service gets the URLs of its peers so the browser-side CORS
        # header is set correctly without hardcoding localhost.
        env {
          name  = "CORS_ORIGINS"
          value = join(",", [
            google_cloud_run_service.venueiq_services["ingestion"].status[0].url,
            google_cloud_run_service.venueiq_services["prediction"].status[0].url,
            google_cloud_run_service.venueiq_services["notification"].status[0].url,
          ])
        }

        ports {
          container_port = 8000
          protocol       = "TCP"
        }

        # Liveness probe — adjust path per service if needed
        liveness_probe {
          http_get {
            path = "/health"
            port = 8000
          }
          initial_delay_seconds = 5
          period_seconds        = 30
          failure_threshold     = 3
        }

        startup_probe {
          http_get {
            path = "/health"
            port = 8000
          }
          initial_delay_seconds = 5
          period_seconds        = 5
          failure_threshold     = 10
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  # Ignore image tag changes so manual deploys / CD pipelines are not overwritten
  lifecycle {
    ignore_changes = [
      template[0].spec[0].containers[0].image,
      template[0].metadata[0].annotations["client.knative.dev/user-image"],
      template[0].metadata[0].annotations["run.googleapis.com/client-name"],
      template[0].metadata[0].annotations["run.googleapis.com/client-version"],
    ]
  }

  depends_on = [
    google_project_service.apis,
    google_service_account.venueiq_sa,
    google_project_iam_member.venueiq_sa_roles,
    google_secret_manager_secret.firebase_credentials,
    google_secret_manager_secret.gemini_api_key,
  ]
}

# ---------------------------------------------------------------------------
# Allow unauthenticated access to Cloud Run services
# Remove this block and implement Cloud Endpoints / IAP for private deployments
# ---------------------------------------------------------------------------
resource "google_cloud_run_service_iam_member" "public_access" {
  for_each = var.services

  service  = google_cloud_run_service.venueiq_services[each.key].name
  location = var.region
  project  = var.project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}
