from pydantic import BaseModel, Field
from typing import Literal
from pydantic import ConfigDict

class BaseStrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

class AlertRequest(BaseStrictModel):
    zone_id: str
    message: str

class NotifyRequest(BaseStrictModel):
    zone_id: str
    message: str
    discount_code: str = "VENUEIQ10"
    estimated_recipients: int = Field(default=100, ge=1, le=10000)

class WhatIfRequest(BaseStrictModel):
    zone_id: str
    action: Literal["redirect", "staff"]
    value: int = Field(ge=1, le=100)
