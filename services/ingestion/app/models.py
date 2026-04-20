from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
import hashlib
from typing import Optional

class BaseStrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

class POSWebhook(BaseStrictModel):
    zone_id: str
    stand_id: str
    timestamp: datetime
    items_count: int

class TicketWebhook(BaseStrictModel):
    gate_id: str
    timestamp: datetime
    ticket_type: str
    zone_id: str = "unknown"

class WiFiTelemetry(BaseStrictModel):
    ap_id: str
    mac_hash: str = Field(alias="mac_address")
    rssi: int
    timestamp: datetime
    zone_id: str = "unknown"

    @field_validator("mac_hash", mode="before")
    @classmethod
    def hash_mac_address(cls, v: str) -> str:
        # Prevent double-hashing if instantiated with a hash internally
        if len(v) == 64 and all(c in "0123456789abcdefABCDEF" for c in v):
            return v
        return hashlib.sha256(v.encode("utf-8")).hexdigest()
