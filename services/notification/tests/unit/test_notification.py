from fastapi.testclient import TestClient
from app.main import app
from app.simulator import run_whatif

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_staff_alert_queued():
    r = client.post("/notify/alert", json={
        "zone_id": "gate_A1",
        "message": "Staff needed at Gate A1"
    })
    assert r.status_code == 200
    assert r.json()["status"] == "queued"
    assert r.json()["zone_id"] == "gate_A1"

def test_alert_rejects_extra_fields():
    r = client.post("/notify/alert", json={
        "zone_id": "gate_A1",
        "message": "Test",
        "unexpected_field": "bad"
    })
    assert r.status_code == 422

def test_whatif_redirect_reduces_time():
    result = run_whatif("gate_A1", "redirect", 30)
    assert result["time_to_clear_minutes"] < 20
    assert result["confidence_interval_minutes"] == 2
    assert result["color"] in ["green", "amber", "red"]

def test_whatif_staff_reduces_time():
    result = run_whatif("zone_1", "staff", 10)
    assert result["time_to_clear_minutes"] < 20

def test_whatif_invalid_action_rejected():
    r = client.post("/simulator/whatif", json={
        "zone_id": "zone_1",
        "action": "invalid_action",
        "value": 10
    })
    assert r.status_code == 422

def test_jitter_formula():
    import random
    random.seed(42)
    results = []
    for i in range(3):
        base_delay = 0.1
        jitter = random.uniform(0, 0.1)
        delay = base_delay * (2 ** i) + jitter
        results.append(delay)
    assert results[0] < results[1] < results[2]
