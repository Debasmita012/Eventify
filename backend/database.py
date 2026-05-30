import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client = None
_db     = None

def get_db():
    global _client, _db
    if _client is None:
        _client = MongoClient(os.environ["MONGO_URL"])
        _db     = _client["eventify"]
    return _db

def init_db():
    db = get_db()
    # Create indexes for fast lookups
    db.users.create_index("id",    unique=True)
    db.users.create_index("email", unique=True)
    db.events.create_index("id",   unique=True)
    db.rsvps.create_index([("user_id", 1), ("event_id", 1)], unique=True)
    db.bookmarks.create_index([("user_id", 1), ("event_id", 1)], unique=True)
    print("✅ MongoDB connected and indexes ready")
