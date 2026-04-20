import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.models import POSWebhook, TicketWebhook, WiFiTelemetry
from app.publisher import publish_to_topic
from app.zone_map import get_zone_id
from app.fallback import init_db, get_pending_events, mark_delivered, increment_retry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def retry_failed_events_loop():
    while True:
        try:
            events = get_pending_events()
            for event in events:
                success = publish_to_topic(event["topic"], event["payload"], skip_fallback=True)
                if success:
                    mark_delivered(event["id"])
                    logger.info(f"Successfully retried event {event['id']}")
                else:
                    increment_retry(event["id"])
                    logger.info(f"Failed retry for event {event['id']}")
        except Exception as e:
            logger.error(f"Error in retry loop: {e}")
        await asyncio.sleep(30)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    task = asyncio.create_task(retry_failed_events_loop())
    yield
    task.cancel()

limiter = Limiter(key_func=get_remote_address, default_limits=["1000/minute"])
app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/health")
@limiter.exempt
async def health():
    return {"status": "ok"}

@app.post("/webhook/pos")
@limiter.limit("1000/minute")
async def pos_webhook(request: Request, payload: POSWebhook):
    topic = f"zone-{payload.zone_id}-events"
    publish_to_topic(topic, payload.model_dump(mode="json"))
    return {"message": "Success"}

@app.post("/webhook/ticket")
@limiter.limit("1000/minute")
async def ticket_webhook(request: Request, payload: TicketWebhook):
    zone_id = get_zone_id(gate_id=payload.gate_id, default_zone_id=payload.zone_id)
    topic = f"zone-{zone_id}-events"
    publish_to_topic(topic, payload.model_dump(mode="json"))
    return {"message": "Success"}

@app.post("/telemetry/wifi")
@limiter.limit("1000/minute")
async def wifi_webhook(request: Request, payload: WiFiTelemetry):
    zone_id = get_zone_id(ap_id=payload.ap_id, default_zone_id=payload.zone_id)
    topic = f"zone-{zone_id}-events"
    publish_to_topic(topic, payload.model_dump(mode="json", by_alias=False))
    return {"message": "Success"}
