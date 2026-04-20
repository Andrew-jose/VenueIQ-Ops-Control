variable "project_id" {
  description = "The GCP project ID to deploy all resources into."
  type        = string
}

variable "region" {
  description = "The GCP region for all regional resources (Cloud Run, Pub/Sub, BigQuery, etc.)."
  type        = string
  default     = "us-central1"
}

variable "artifact_registry_repo" {
  description = "Artifact Registry repository name that holds service images."
  type        = string
  default     = "venueiq-repo"
}

variable "services" {
  description = "Map of Cloud Run service names to their image tags."
  type = map(object({
    image_tag     = string
    min_instances = number
    max_instances = number
    memory        = string
    cpu           = string
  }))
  default = {
    ingestion = {
      image_tag     = "latest"
      min_instances = 0
      max_instances = 5
      memory        = "512Mi"
      cpu           = "1"
    }
    prediction = {
      image_tag     = "latest"
      min_instances = 0
      max_instances = 3
      memory        = "1Gi"
      cpu           = "2"
    }
    notification = {
      image_tag     = "latest"
      min_instances = 0
      max_instances = 5
      memory        = "512Mi"
      cpu           = "1"
    }
  }
}
