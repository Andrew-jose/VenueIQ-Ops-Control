import os
import json
import logging
from google.cloud import pubsub_v1
from app.fallback import save_failed_event

project_id = os.getenv("PROJECT_ID", "venueiq-test-project")
publisher_client = pubsub_v1.PublisherClient()
logger = logging.getLogger(__name__)

def publish_to_topic(topic_id: str, payload: dict, skip_fallback: bool = False) -> bool:
    """
    Publishes a dictionary payload to a Pub/Sub topic.
    Returns True on success, False if it failed and was written to SQLite fallback.
    """
    topic_path = publisher_client.topic_path(project_id, topic_id)
    data_str = json.dumps(payload, default=str)
    data_bytes = data_str.encode("utf-8")

    try:
        # For unit testing, provide a way to mock without networking errors
        if os.getenv("TESTING") == "true":
             logger.info(f"Mock publish to {topic_path}")
             return True

        future = publisher_client.publish(topic_path, data_bytes)
        # Block until confirmed or throws an exception
        future.result(timeout=5)
        return True
    except Exception as e:
        logger.error(f"Pub/Sub publish failed for topic {topic_id}: {e}")
        if not skip_fallback:
            save_failed_event(topic_id, payload, str(e))
        return False
