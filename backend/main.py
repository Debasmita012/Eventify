from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import json, uuid, os
import requests as req_lib
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from database import get_db, init_db
import recommender
from chatbot import ask_campusbot

app = FastAPI()

app.add_middleware(CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ──────────────────────────────────
@app.on_event("startup")
def startup():
    init_db()
    print("✅ Eventify API started")

# ── Models ────────────────────────────────────
class OnboardReq(BaseModel):
    name: str
    email: str
    department: str
    interests: List[str]

class RSVPReq(BaseModel):
    user_id: str
    event_id: int

class BookmarkReq(BaseModel):
    user_id: str
    event_id: int

class EventCreate(BaseModel):
    title: str
    description: str
    category: str
    venue: str
    datetime: str
    why_it_matters: Optional[str] = ""
    lat: Optional[float] = 22.578
    lng: Optional[float] = 88.432
    organizer_id: str

class ChatReq(BaseModel):
    user_id: str
    message: str
    history: Optional[List] = []

# ── Health check ──────────────────────────────
@app.get("/")
def root():
    return {"status": "Eventify API running ✅"}

# ── Auth / Onboarding ─────────────────────────
@app.post("/onboard")
def onboard(req: OnboardReq):
    conn = get_db()
    user_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO users VALUES (?,?,?,?,?,?,?,?)",
        (user_id, req.name, req.email,
         json.dumps(req.interests), req.department,
         "student", 0, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    return {"user_id": user_id, "name": req.name}

@app.get("/user/{user_id}")
def get_user(user_id: str):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE id=?", (user_id,)
    ).fetchone()
    conn.close()
    if not user:
        raise HTTPException(404, "User not found")
    return dict(user)

# ── Events ────────────────────────────────────
@app.get("/events")
def get_events(category: Optional[str] = None):
    conn = get_db()
    if category:
        rows = conn.execute(
            "SELECT * FROM events WHERE category=? ORDER BY rsvp_count DESC",
            (category,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM events ORDER BY rsvp_count DESC"
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/events/{event_id}")
def get_event(event_id: int):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM events WHERE id=?", (event_id,)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Event not found")
    return dict(row)

@app.post("/events")
def create_event(req: EventCreate):
    conn = get_db()
    cur = conn.execute("""
        INSERT INTO events
        (title,description,category,venue,lat,lng,
         datetime,organizer_id,image_url,why_it_matters)
        VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING id""",
        (req.title, req.description, req.category,
         req.venue, req.lat, req.lng, req.datetime,
         req.organizer_id,
         f"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
         req.why_it_matters)
    )
    event_id = cur.fetchone()['id']
    conn.commit()
    events = [dict(r) for r in conn.execute("SELECT * FROM events").fetchall()]
    conn.close()
    recommender.index_all_events(events)
    return {"event_id": event_id, "message": "Event created ✅"}

# ── Feed & Recommendations ─────────────────────
@app.get("/feed/{user_id}")
def get_feed(user_id: str):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE id=?", (user_id,)
    ).fetchone()
    if not user:
        raise HTTPException(404, "User not found")
    interests = json.loads(user["interests"])
    all_events = [dict(r) for r in conn.execute(
        "SELECT * FROM events ORDER BY rsvp_count DESC"
    ).fetchall()]
    conn.close()
    from recommender import recommend_events
    return recommend_events(all_events, interests, n=8)

@app.get("/search")
def search(q: str = Query(...)):
    conn = get_db()
    all_events = [dict(r) for r in conn.execute(
        "SELECT * FROM events ORDER BY rsvp_count DESC"
    ).fetchall()]
    conn.close()
    from recommender import search_events
    return search_events(all_events, q, n=8)

@app.get("/surprise/{user_id}")
def surprise(user_id: str):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE id=?", (user_id,)
    ).fetchone()
    if not user:
        raise HTTPException(404)
    interests = json.loads(user["interests"])
    all_events = [dict(r) for r in conn.execute(
        "SELECT * FROM events"
    ).fetchall()]
    conn.close()
    from recommender import get_surprise
    result = get_surprise(all_events, interests)
    if not result:
        raise HTTPException(404, "No events found")
    return result

# ── RSVP ──────────────────────────────────────
@app.post("/rsvp")
def rsvp(req: RSVPReq):
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM rsvps WHERE user_id=? AND event_id=?",
        (req.user_id, req.event_id)
    ).fetchone()

    event = conn.execute(
        "SELECT * FROM events WHERE id=?", (req.event_id,)
    ).fetchone()
    if not event:
        raise HTTPException(404, "Event not found")

    # Conflict check
    user_rsvps = conn.execute("""
        SELECT e.title, e.datetime FROM rsvps r
        JOIN events e ON r.event_id = e.id
        WHERE r.user_id=?""", (req.user_id,)
    ).fetchall()

    conflict = None
    try:
        t1 = datetime.fromisoformat(event["datetime"])
        for r in user_rsvps:
            t2 = datetime.fromisoformat(r["datetime"])
            if abs((t1 - t2).total_seconds()) < 7200:
                conflict = r["title"]
                break
    except:
        pass

    if existing:
        conn.execute(
            "DELETE FROM rsvps WHERE user_id=? AND event_id=?",
            (req.user_id, req.event_id)
        )
        conn.execute(
            "UPDATE events SET rsvp_count=MAX(0,rsvp_count-1) WHERE id=?",
            (req.event_id,)
        )
        conn.commit()
        conn.close()
        return {"action": "removed", "conflict": None}
    else:
        conn.execute(
            "INSERT INTO rsvps VALUES (null,?,?,?)",
            (req.user_id, req.event_id, datetime.now().isoformat())
        )
        conn.execute(
            "UPDATE events SET rsvp_count=rsvp_count+1 WHERE id=?",
            (req.event_id,)
        )
        # Add points
        conn.execute(
            "UPDATE users SET points=points+20 WHERE id=?",
            (req.user_id,)
        )
        conn.execute(
            "INSERT INTO points_log VALUES (null,?,?,?,?)",
            (req.user_id, "rsvp", 20, datetime.now().isoformat())
        )
        conn.commit()
        conn.close()
        return {"action": "added", "conflict": conflict}

@app.get("/rsvps/{user_id}")
def get_user_rsvps(user_id: str):
    conn = get_db()
    rows = conn.execute("""
        SELECT e.* FROM rsvps r
        JOIN events e ON r.event_id=e.id
        WHERE r.user_id=? ORDER BY e.datetime""",
        (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── Bookmarks ─────────────────────────────────
@app.post("/bookmark")
def bookmark(req: BookmarkReq):
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM bookmarks WHERE user_id=? AND event_id=?",
        (req.user_id, req.event_id)
    ).fetchone()
    if existing:
        conn.execute(
            "DELETE FROM bookmarks WHERE user_id=? AND event_id=?",
            (req.user_id, req.event_id)
        )
        action = "removed"
    else:
        conn.execute(
            "INSERT INTO bookmarks VALUES (null,?,?)",
            (req.user_id, req.event_id)
        )
        conn.execute(
            "UPDATE users SET points=points+5 WHERE id=?",
            (req.user_id,)
        )
        action = "added"
    conn.commit()
    conn.close()
    return {"action": action}

@app.get("/bookmarks/{user_id}")
def get_bookmarks(user_id: str):
    conn = get_db()
    rows = conn.execute("""
        SELECT e.* FROM bookmarks b
        JOIN events e ON b.event_id=e.id
        WHERE b.user_id=?""", (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── Analytics ─────────────────────────────────
@app.get("/analytics/{event_id}")
def analytics(event_id: int):
    conn = get_db()
    event = conn.execute(
        "SELECT * FROM events WHERE id=?", (event_id,)
    ).fetchone()
    if not event:
        raise HTTPException(404)
    conn.close()

    total = event["rsvp_count"]
    weights = [1,1,2,2,3,5,8,10,12,10,8,6,5,4,3]
    hours = {}
    for i, h in enumerate(range(8, 23)):
        hours[str(h)] = int(total * weights[i] / sum(weights)) if total else 0

    departments = {
        "Computer Science": int(total * 0.34),
        "Electronics":      int(total * 0.22),
        "Mechanical":       int(total * 0.18),
        "Civil":            int(total * 0.15),
        "Other":            int(total * 0.11),
    }

    success_score = min(100, int(
        (total / 500) * 60 +
        (len([v for v in departments.values() if v > 0]) / 5) * 40
    ))

    return {
        "event": dict(event),
        "total_rsvps": total,
        "hourly": hours,
        "departments": departments,
        "success_score": success_score,
    }

# ── Leaderboard ───────────────────────────────
@app.get("/leaderboard")
def leaderboard():
    conn = get_db()
    rows = conn.execute("""
        SELECT name, department, points FROM users
        WHERE role='student'
        ORDER BY points DESC LIMIT 10"""
    ).fetchall()
    conn.close()
    # Pad with fake students if DB is sparse
    result = [dict(r) for r in rows]
    fake = [
        {"name":"Priya Sharma","department":"Computer Science","points":340},
        {"name":"Arjun Das","department":"Electronics","points":290},
        {"name":"Sneha Roy","department":"Computer Science","points":260},
        {"name":"Rohit Patel","department":"Mechanical","points":230},
        {"name":"Ankita Sen","department":"Civil","points":200},
    ]
    seen = {r["name"] for r in result}
    for f in fake:
        if f["name"] not in seen and len(result) < 10:
            result.append(f)
    return sorted(result, key=lambda x: x["points"], reverse=True)[:10]

# ── Portfolio ─────────────────────────────────
@app.get("/portfolio/{user_id}")
def portfolio(user_id: str):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE id=?", (user_id,)
    ).fetchone()
    if not user:
        raise HTTPException(404)
    rsvps = conn.execute("""
        SELECT e.category, COUNT(*) as cnt FROM rsvps r
        JOIN events e ON r.event_id=e.id
        WHERE r.user_id=? GROUP BY e.category""",
        (user_id,)
    ).fetchall()
    events = conn.execute("""
        SELECT e.* FROM rsvps r
        JOIN events e ON r.event_id=e.id
        WHERE r.user_id=?""", (user_id,)
    ).fetchall()
    conn.close()
    total_rsvps = sum(r["cnt"] for r in rsvps)
    mar_points = total_rsvps * 20
    return {
        "user": dict(user),
        "total_rsvps": total_rsvps,
        "mar_points": mar_points,
        "category_breakdown": {r["category"]: r["cnt"] for r in rsvps},
        "events": [dict(e) for e in events],
    }

# ── Map ───────────────────────────────────────
@app.get("/map/events")
def map_events():
    conn = get_db()
    rows = conn.execute(
        "SELECT id,title,category,venue,lat,lng,datetime,rsvp_count FROM events"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── Calendar Export ───────────────────────────
@app.get("/export/{event_id}.ics")
def export_ics(event_id: int):
    conn = get_db()
    e = conn.execute(
        "SELECT * FROM events WHERE id=?", (event_id,)
    ).fetchone()
    conn.close()
    if not e:
        raise HTTPException(404)
    try:
        from ics import Calendar, Event as ICSEvent
        c = Calendar()
        ev = ICSEvent()
        ev.name = e["title"]
        ev.begin = e["datetime"]
        ev.location = e["venue"]
        ev.description = e["description"]
        c.events.add(ev)
        path = f"/tmp/event_{event_id}.ics"
        with open(path, "w") as f:
            f.writelines(c)
        return FileResponse(path, media_type="text/calendar",
            filename=f"{e['title'].replace(' ','_')}.ics")
    except Exception as ex:
        raise HTTPException(500, str(ex))

# ── Chatbot ───────────────────────────────────
@app.post("/chat")
def chat(req: ChatReq):
    conn = get_db()
    events = [dict(r) for r in conn.execute("SELECT * FROM events").fetchall()]
    conn.close()
    try:
        reply = ask_campusbot(req.message, events, req.history)
    except Exception as e:
        reply = f"CampusBot is offline right now. Error: {str(e)}"
    conn = get_db()
    conn.execute(
        "INSERT INTO chat_sessions VALUES (null,?,?,?,?)",
        (req.user_id, req.message, reply, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    return {"reply": reply}

@app.post("/chat/stream")
async def chat_stream(request: ChatReq):
    # Fall back to rule-based chatbot as SSE stream
    conn = get_db()
    events = [dict(r) for r in conn.execute("SELECT * FROM events").fetchall()]
    conn.close()
    reply = ask_campusbot(request.message, events, request.history)

    def generate():
        # Send whole reply word by word to simulate streaming
        words = reply.split(" ")
        for i, word in enumerate(words):
            token = word if i == len(words)-1 else word + " "
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

