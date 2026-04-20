import sqlite3
import json
import os
from typing import List, Dict, Any

DB_PATH = os.getenv("FALLBACK_DB_PATH", "failed_events.db")

def get_connection():
    return sqlite3.connect(DB_PATH, isolation_level=None)

def init_db():
    query = """
    CREATE TABLE IF NOT EXISTS failed_pubsub_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT NOT NULL,
        payload TEXT NOT NULL,
        error TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        retry_count INTEGER DEFAULT 0,
        delivered INTEGER DEFAULT 0,
        permanently_failed INTEGER DEFAULT 0
    )
    """
    with get_connection() as conn:
        conn.execute(query)

def save_failed_event(topic: str, payload: Dict[str, Any], error: str):
    query = """
    INSERT INTO failed_pubsub_events (topic, payload, error)
    VALUES (?, ?, ?)
    """
    with get_connection() as conn:
        # Default fallback mechanism for datetime object serialization
        conn.execute(query, (topic, json.dumps(payload, default=str), error))

def get_pending_events() -> List[Dict[str, Any]]:
    query = """
    SELECT id, topic, payload, retry_count
    FROM failed_pubsub_events
    WHERE delivered = 0 AND permanently_failed = 0
    ORDER BY timestamp ASC
    """
    with get_connection() as conn:
        cursor = conn.execute(query)
        rows = cursor.fetchall()
        
    events = []
    for row in rows:
        events.append({
            "id": row[0],
            "topic": row[1],
            "payload": json.loads(row[2]),
            "retry_count": row[3]
        })
    return events

def mark_delivered(event_id: int):
    query = "UPDATE failed_pubsub_events SET delivered = 1 WHERE id = ?"
    with get_connection() as conn:
        conn.execute(query, (event_id,))

def increment_retry(event_id: int):
    query = """
    UPDATE failed_pubsub_events 
    SET retry_count = retry_count + 1,
        permanently_failed = CASE WHEN retry_count + 1 >= 5 THEN 1 ELSE 0 END
    WHERE id = ?
    """
    with get_connection() as conn:
        conn.execute(query, (event_id,))
