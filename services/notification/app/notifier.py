import asyncio
import random
import logging
import datetime

logger = logging.getLogger("venueiq.notifier")
logging.basicConfig(level=logging.INFO)

async def send_targeted_notification(
    zone_id: str,
    message: str,
    notification_type: str = "alert",
    discount_code: str = None
):
    """
    In production: queries Firebase for device tokens 
    near zone_id and sends via FCM Admin SDK.
    
    In demo mode: simulates the jitter batching algorithm
    from the VenueIQ architecture spec.
    """
    estimated_tokens = random.randint(200, 800)
    batch_size = 500
    batches = (estimated_tokens // batch_size) + 1

    logger.info(
        f"[{notification_type.upper()}] Zone {zone_id} | "
        f"~{estimated_tokens} recipients | "
        f"{batches} batch(es)"
    )

    for batch_idx in range(batches):
        # Exponential jitter: prevents synchronized 
        # network storms when all users tap notification
        base_delay = 0.1
        jitter = random.uniform(0, 0.1)
        delay = base_delay * (2 ** batch_idx) + jitter
        
        await asyncio.sleep(delay)
        
        batch_count = min(
            batch_size, 
            estimated_tokens - (batch_idx * batch_size)
        )
        
        logger.info(
            f"  Batch {batch_idx + 1}/{batches}: "
            f"sent {batch_count} notifications "
            f"(delay={delay:.3f}s)"
        )

    logger.info(
        f"[COMPLETE] All notifications delivered | "
        f"zone={zone_id} | "
        f"type={notification_type} | "
        f"discount={discount_code}"
    )
