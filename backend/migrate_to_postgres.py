import sqlite3
import psycopg2
import os
import json
from dotenv import load_dotenv

load_dotenv()

DB_PATH = "campus.db"
DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    if not DATABASE_URL:
        print("❌ ERROR: DATABASE_URL environment variable is not set.")
        return

    if not os.path.exists(DB_PATH):
        print(f"❌ ERROR: SQLite database '{DB_PATH}' not found.")
        return

    print("Connecting to databases...")
    sqlite_conn = sqlite3.connect(DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    pg_conn = psycopg2.connect(DATABASE_URL)
    pg_conn.autocommit = True
    pg_cur = pg_conn.cursor()

    tables = ["users", "events", "rsvps", "bookmarks", "chat_sessions", "points_log"]

    for table in tables:
        print(f"\nMigrating table: {table}...")
        sqlite_cur.execute(f"SELECT * FROM {table}")
        rows = sqlite_cur.fetchall()
        
        if not rows:
            print(f"  - No rows found in {table}, skipping.")
            continue

        columns = rows[0].keys()
        col_names = ", ".join(columns)
        placeholders = ", ".join(["%s"] * len(columns))
        
        insert_query = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
        
        count = 0
        for row in rows:
            values = tuple(row[col] for col in columns)
            try:
                pg_cur.execute(insert_query, values)
                count += 1
            except Exception as e:
                print(f"  - Error inserting row into {table}: {e}")
                
        print(f"  ✅ Migrated {count} rows into {table}.")
        
        # Reset sequence for autoincrement tables in Postgres so new inserts don't fail
        if table != "users":
            try:
                pg_cur.execute(f"SELECT setval('{table}_id_seq', COALESCE((SELECT MAX(id)+1 FROM {table}), 1), false);")
                print(f"  ✅ Reset sequence for {table}_id_seq.")
            except Exception as e:
                print(f"  - Note: Could not reset sequence for {table}: {e}")

    print("\n🎉 Migration complete!")
    sqlite_conn.close()
    pg_conn.close()

if __name__ == "__main__":
    migrate()
