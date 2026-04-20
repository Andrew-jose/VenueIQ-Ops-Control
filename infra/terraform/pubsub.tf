# ---------------------------------------------------------------------------
# Pub/Sub Topic: zone-events (7-day retention)
# ---------------------------------------------------------------------------
resource "google_pubsub_topic" "zone_events" {
  name    = "zone-events"
  project = var.project_id

  message_retention_duration = "604800s" # 7 days in seconds

  labels = {
    app = "venueiq"
    env = "production"
  }

  depends_on = [google_project_service.apis]
}

# ---------------------------------------------------------------------------
# Pub/Sub Subscription: zone-events-sub (60s ack deadline)
# ---------------------------------------------------------------------------
resource "google_pubsub_subscription" "zone_events_sub" {
  name    = "zone-events-sub"
  project = var.project_id
  topic   = google_pubsub_topic.zone_events.name

  ack_deadline_seconds = 60

  # Retain unacknowledged messages for 7 days (matches topic retention)
  message_retention_duration = "604800s"

  # Retry policy: exponential back-off
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "300s"
  }

  # Dead-letter topic (optional but recommended for production)
  # Uncomment after creating a dead-letter topic:
  # dead_letter_policy {
  #   dead_letter_topic     = google_pubsub_topic.zone_events_dead_letter.id
  #   max_delivery_attempts = 5
  # }

  labels = {
    app = "venueiq"
    env = "production"
  }

  depends_on = [google_pubsub_topic.zone_events]
}
