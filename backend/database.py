import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Example: postgres://user:pass@host:port/dbname
DATABASE_URL = os.getenv("DATABASE_URL")

class DBWrapper:
    def __init__(self, conn):
        self.conn = conn

    def execute(self, query, params=None):
        cur = self.conn.cursor(cursor_factory=RealDictCursor)
        # Postgres uses %s instead of ?
        query = query.replace("?", "%s")
        # Replace SQLite MAX with Postgres GREATEST
        query = query.replace("MAX(0,rsvp_count-1)", "GREATEST(0,rsvp_count-1)")
        # Replace SQLite null with DEFAULT for inserts
        query = query.replace("VALUES (null,", "VALUES (DEFAULT,")
        
        # Note: returning id is handled manually in main.py for events
        if params:
            cur.execute(query, params)
        else:
            cur.execute(query)
        return cur

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()

def get_db():
    if not DATABASE_URL:
        raise Exception("DATABASE_URL environment variable is not set. Please set it to your PostgreSQL database URL.")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    return DBWrapper(conn)

def init_db():
    if not DATABASE_URL:
        print("⚠️ Skipping DB init: DATABASE_URL not set")
        return

    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            interests TEXT,
            department TEXT,
            role TEXT DEFAULT 'student',
            points INTEGER DEFAULT 0,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            title TEXT,
            description TEXT,
            category TEXT,
            venue TEXT,
            lat REAL,
            lng REAL,
            datetime TEXT,
            rsvp_count INTEGER DEFAULT 0,
            organizer_id TEXT,
            image_url TEXT,
            why_it_matters TEXT
        );

        CREATE TABLE IF NOT EXISTS rsvps (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            event_id INTEGER,
            rsvp_at TEXT,
            UNIQUE(user_id, event_id)
        );

        CREATE TABLE IF NOT EXISTS bookmarks (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            event_id INTEGER,
            UNIQUE(user_id, event_id)
        );

        CREATE TABLE IF NOT EXISTS chat_sessions (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            message TEXT,
            response TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS points_log (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            action TEXT,
            points INTEGER,
            created_at TEXT
        );
    """)
    conn.close()
    print("✅ Database ready")
