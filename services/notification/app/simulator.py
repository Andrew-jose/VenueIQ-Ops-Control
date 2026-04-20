import random
import datetime

ZONE_DISPLAY_NAMES = {
    "gate_A1": "Gate A1", "gate_A2": "Gate A2",
    "gate_B1": "Gate B1", "gate_B2": "Gate B2",
    "concourse_N": "North Concourse",
    "concourse_S": "South Concourse",
    "concourse_E": "East Concourse",
    "concourse_W": "West Concourse",
    "zone_1": "Zone 1", "zone_2": "Zone 2",
    "zone_3": "Zone 3", "zone_4": "Zone 4",
}

def run_whatif(zone_id: str, action: str, value: int) -> dict:
    base_wait = 20
    if action == "redirect":
        time_to_clear = round(base_wait / (1 + value * 0.15))
    else:  # staff
        time_to_clear = round(base_wait / (1 + value * 0.20))

    time_to_clear = max(1, min(time_to_clear, 60))
    
    if time_to_clear < 10:
        severity = "low"
        color = "green"
    elif time_to_clear < 20:
        severity = "medium"
        color = "amber"
    else:
        severity = "high"
        color = "red"

    return {
        "zone_id": zone_id,
        "zone_name": ZONE_DISPLAY_NAMES.get(zone_id, zone_id),
        "action": action,
        "value": value,
        "time_to_clear_minutes": time_to_clear,
        "confidence_interval_minutes": 2,
        "severity": severity,
        "color": color,
        "simulated_at": datetime.datetime.utcnow().isoformat(),
        "recommendation": (
            f"Redirecting {value}% of crowd reduces wait "
            f"to ~{time_to_clear} min"
            if action == "redirect"
            else f"Adding {value} staff reduces wait "
                 f"to ~{time_to_clear} min"
        )
    }
