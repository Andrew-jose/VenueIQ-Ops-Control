# ---------------------------------------------------------------------------
# BigQuery Dataset: venue_analytics
# ---------------------------------------------------------------------------
resource "google_bigquery_dataset" "venue_analytics" {
  dataset_id                  = "venue_analytics"
  friendly_name               = "VenueIQ Analytics"
  description                 = "Stores crowd density streams and notification logs for VenueIQ."
  project                     = var.project_id
  location                    = var.region
  delete_contents_on_destroy  = false

  # Default table expiration: never (null)
  default_table_expiration_ms = null

  labels = {
    app = "venueiq"
    env = "production"
  }

  # Grant the service account data editor access at the dataset level
  access {
    role          = "OWNER"
    special_group = "projectOwners"
  }

  access {
    role          = "WRITER"
    user_by_email = google_service_account.venueiq_sa.email
  }

  access {
    role          = "READER"
    special_group = "projectReaders"
  }

  depends_on = [
    google_project_service.apis,
    google_service_account.venueiq_sa,
  ]
}

# ---------------------------------------------------------------------------
# BigQuery Table: zone_density_stream
# ---------------------------------------------------------------------------
resource "google_bigquery_table" "zone_density_stream" {
  dataset_id          = google_bigquery_dataset.venue_analytics.dataset_id
  table_id            = "zone_density_stream"
  project             = var.project_id
  deletion_protection = true

  description = "Real-time crowd density readings per zone, ingested from Pub/Sub."

  time_partitioning {
    type  = "DAY"
    field = "timestamp"
  }

  clustering = ["zone_id"]

  schema = jsonencode([
    {
      name        = "zone_id"
      type        = "STRING"
      mode        = "REQUIRED"
      description = "Unique identifier for the venue zone."
    },
    {
      name        = "timestamp"
      type        = "TIMESTAMP"
      mode        = "REQUIRED"
      description = "UTC timestamp of the density reading."
    },
    {
      name        = "crowd_density"
      type        = "FLOAT"
      mode        = "NULLABLE"
      description = "Normalised crowd density value between 0.0 and 1.0."
    },
    {
      name        = "transaction_rate"
      type        = "FLOAT"
      mode        = "NULLABLE"
      description = "Transactions per minute recorded in this zone."
    },
  ])

  labels = {
    app = "venueiq"
    env = "production"
  }

  depends_on = [google_bigquery_dataset.venue_analytics]
}

# ---------------------------------------------------------------------------
# BigQuery Table: notification_log
# ---------------------------------------------------------------------------
resource "google_bigquery_table" "notification_log" {
  dataset_id          = google_bigquery_dataset.venue_analytics.dataset_id
  table_id            = "notification_log"
  project             = var.project_id
  deletion_protection = true

  description = "Audit log of every push notification dispatched by the notification service."

  time_partitioning {
    type  = "DAY"
    field = "timestamp"
  }

  clustering = ["zone_id"]

  schema = jsonencode([
    {
      name        = "notification_id"
      type        = "STRING"
      mode        = "REQUIRED"
      description = "Globally unique identifier for the notification batch."
    },
    {
      name        = "zone_id"
      type        = "STRING"
      mode        = "REQUIRED"
      description = "Zone that triggered this notification."
    },
    {
      name        = "tokens_sent"
      type        = "INT64"
      mode        = "NULLABLE"
      description = "Number of FCM tokens targeted in this dispatch."
    },
    {
      name        = "timestamp"
      type        = "TIMESTAMP"
      mode        = "REQUIRED"
      description = "UTC timestamp when the notification was sent."
    },
  ])

  labels = {
    app = "venueiq"
    env = "production"
  }

  depends_on = [google_bigquery_dataset.venue_analytics]
}
