# ---------------------------------------------------------------------------
# Output: Cloud Run Service URLs
# ---------------------------------------------------------------------------
output "ingestion_service_url" {
  description = "Public HTTPS URL of the VenueIQ Ingestion Cloud Run service."
  value       = google_cloud_run_service.venueiq_services["ingestion"].status[0].url
}

output "prediction_service_url" {
  description = "Public HTTPS URL of the VenueIQ Prediction Cloud Run service."
  value       = google_cloud_run_service.venueiq_services["prediction"].status[0].url
}

output "notification_service_url" {
  description = "Public HTTPS URL of the VenueIQ Notification Cloud Run service."
  value       = google_cloud_run_service.venueiq_services["notification"].status[0].url
}

# ---------------------------------------------------------------------------
# Output: Supporting infrastructure identifiers
# ---------------------------------------------------------------------------
output "pubsub_topic_id" {
  description = "Full resource ID of the zone-events Pub/Sub topic."
  value       = google_pubsub_topic.zone_events.id
}

output "pubsub_subscription_id" {
  description = "Full resource ID of the zone-events-sub Pub/Sub subscription."
  value       = google_pubsub_subscription.zone_events_sub.id
}

output "bigquery_dataset_id" {
  description = "BigQuery dataset ID for venue_analytics."
  value       = google_bigquery_dataset.venue_analytics.dataset_id
}

output "zone_density_table_id" {
  description = "Fully-qualified BigQuery table ID for zone_density_stream."
  value       = "${var.project_id}.${google_bigquery_dataset.venue_analytics.dataset_id}.${google_bigquery_table.zone_density_stream.table_id}"
}

output "notification_log_table_id" {
  description = "Fully-qualified BigQuery table ID for notification_log."
  value       = "${var.project_id}.${google_bigquery_dataset.venue_analytics.dataset_id}.${google_bigquery_table.notification_log.table_id}"
}

output "service_account_email" {
  description = "Email address of the venueiq-sa service account."
  value       = google_service_account.venueiq_sa.email
}

output "firebase_secret_name" {
  description = "Full Secret Manager resource name for FIREBASE_CREDENTIALS."
  value       = google_secret_manager_secret.firebase_credentials.name
}

output "gemini_secret_name" {
  description = "Full Secret Manager resource name for GEMINI_API_KEY."
  value       = google_secret_manager_secret.gemini_api_key.name
}
