"""
Mapping file to resolve zone IDs for Ticket and WiFi payloads.
"""

GATE_TO_ZONE = {
    "gate_A1": "zone_1",
    "gate_A2": "zone_1",
    "gate_B1": "zone_2",
}

AP_TO_ZONE = {
    "ap_101": "zone_1",
    "ap_102": "zone_1",
    "ap_201": "zone_2",
}

def get_zone_id(gate_id: str = None, ap_id: str = None, default_zone_id: str = "zone-unknown-events") -> str:
    """
    Resolve zone_id based on gate_id or ap_id mapping.
    If not found in mapping, return the default_zone_id provided.
    """
    if gate_id and gate_id in GATE_TO_ZONE:
        return GATE_TO_ZONE[gate_id]
    if ap_id and ap_id in AP_TO_ZONE:
        return AP_TO_ZONE[ap_id]
    
    return default_zone_id
