import pytest
import os
import sqlite3
import hashlib
from fastapi.testclient import TestClient

# Must set TESTING=true to avoid actual pubsub networking
os.environ["TESTING"] = "true"
os.environ["FALLBACK_DB_PATH"] = ":memory:" # Use in-memory DB for tests

from app.main import app, lifespan
from app.fallback import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    yield

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_pos_webhook_happy_path():
    payload = {
        "zone_id": "zone_3",
        "stand_id": "stand_1",
        "timestamp": "2026-04-19T10:00:00Z",
        "items_count": 5
    }
    response = client.post("/webhook/pos", json=payload)
    assert response.status_code == 200
    assert response.json() == {"message": "Success"}

def test_pos_webhook_invalid_payload():
    payload = {
        "zone_id": "zone_3",
        "stand_id": "stand_1",
        "timestamp": "invalid_date",
        "items_count": "five" # Should be int
    }
    response = client.post("/webhook/pos", json=payload)
    assert response.status_code == 422 # Validation error

def test_pos_webhook_extra_fields():
    payload = {
        "zone_id": "zone_3",
        "stand_id": "stand_1",
        "timestamp": "2026-04-19T10:00:00Z",
        "items_count": 5,
        "extra_field": "disallowed"
    }
    response = client.post("/webhook/pos", json=payload)
    assert response.status_code == 422 # Strict model rejects extra fields

def test_ticket_webhook_zone_mapping():
    payload = {
        "gate_id": "gate_A1",
        "timestamp": "2026-04-19T10:00:00Z",
        "ticket_type": "vip"
    }
    response = client.post("/webhook/ticket", json=payload)
    assert response.status_code == 200

def test_wifi_webhook_mac_hashing():
    raw_mac = "00:1A:2B:3C:4D:5E"
    expected_hash = hashlib.sha256(raw_mac.encode("utf-8")).hexdigest()

    payload = {
        "ap_id": "ap_101",
        "mac_address": raw_mac,
        "rssi": -65,
        "timestamp": "2026-04-19T10:00:00Z"
    }
    
    # We must use the model directly to test its exact serialization
    from app.models import WiFiTelemetry
    model = WiFiTelemetry(**payload)
    assert model.mac_hash == expected_hash
    assert not hasattr(model, "mac_address")
    
    response = client.post("/telemetry/wifi", json=payload)
    assert response.status_code == 200

def test_wifi_webhook_rejects_mac_hash_key_if_strict():
    raw_mac = "00:1A:2B:3C:4D:5E"
    expected_hash = hashlib.sha256(raw_mac.encode("utf-8")).hexdigest()

    payload = {
        "ap_id": "ap_101",
        "mac_hash": expected_hash,
        "mac_address": raw_mac,
        "rssi": -65,
        "timestamp": "2026-04-19T10:00:00Z"
    }
    
    response = client.post("/telemetry/wifi", json=payload)
    assert response.status_code == 422

from app.fallback import save_failed_event, get_pending_events, increment_retry

def test_fallback_logic():
    save_failed_event("zone-test-events", {"fake": "payload"}, "Simulated error")
    events = get_pending_events()
    assert len(events) == 1
    assert events[0]["topic"] == "zone-test-events"
    assert events[0]["retry_count"] == 0

    increment_retry(events[0]["id"])
    events2 = get_pending_events()
    assert events2[0]["retry_count"] == 1
    
    for _ in range(4):
        increment_retry(events[0]["id"])
    
    # After 5 total retries, it should be permanently failed and no longer pending
    events3 = get_pending_events()
    assert len(events3) == 0

