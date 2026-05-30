from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import Optional, List
import json, uuid, os
from datetime import datetime
from dotenv import load_dotenv
import bcrypt

load_dotenv()

from database import get_db, init_db
from recommender import recommend_events, search_events, get_surprise
from chatbot import ask_campusbot

app = FastAPI()

app.add_middleware(CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ───────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    init_db()
    print("✅ Eventify API started")

# ── Health ────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "Eventify API running ✅"}

@app.get("/health")
def health():
    return {"status": "ok"}

# ── Pydantic models ───────────────────────────────────────────────────────
class OnboardReq(BaseModel):
    name:       str
    email:      str
    password:   str
    role:       Optional[str] = "student"
    department: Optional[str] = ""
    interests:  Optional[List[str]] = []

class LoginReq(BaseModel):
    email:    str
    password: str

class RSVPReq(BaseModel):
    user_id:  str
    event_id: int

class BookmarkReq(BaseModel):
    user_id:  str
    event_id: int

class EventCreate(BaseModel):
    title:          str
    description:    str
    category:       str
    venue:          str
    datetime:       str
    why_it_matters: Optional[str] = ""
    lat:            Optional[float] = 22.578
    lng:            Optional[float] = 88.432
    organizer_id:   str

class ChatReq(BaseModel):
    user_id: str
    message: str
    history: Optional[List] = []

# ── Onboarding ────────────────────────────────────────────────────────────
@app.post("/onboard")
def onboard(req: OnboardReq):
    db      = get_db()
    if db.users.find_one({"email": req.email}):
        raise HTTPException(400, "Email already registered")
        
    user_id = str(uuid.uuid4())
    hashed_password = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user    = {
        "id":         user_id,
        "name":       req.name,
        "email":      req.email,
        "password":   hashed_password,
        "interests":  req.interests,
        "department": req.department,
        "role":       req.role,
        "points":     0,
        "created_at": datetime.now().isoformat(),
    }
    db.users.insert_one(user)
    return {"user_id": user_id, "name": req.name, "role": user["role"], "department": user["department"]}

@app.post("/login")
def login(req: LoginReq):
    db = get_db()
    user = db.users.find_one({"email": req.email})
    if not user:
        raise HTTPException(401, "Invalid email or password")
    
    if not bcrypt.checkpw(req.password.encode('utf-8'), user["password"].encode('utf-8')):
        raise HTTPException(401, "Invalid email or password")
        
    return {"user_id": user["id"], "name": user["name"], "role": user.get("role", "student"), "department": user.get("department", "")}

@app.get("/user/{user_id}")
def get_user(user_id: str):
    db   = get_db()
    user = db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")
    return user

# ── Events ────────────────────────────────────────────────────────────────
@app.get("/events")
def get_events(category: Optional[str] = None):
    db    = get_db()
    query = {"category": category} if category else {}
    events = list(db.events.find(query, {"_id": 0})
                           .sort("rsvp_count", -1))
    return events

@app.get("/events/{event_id}")
def get_event(event_id: int):
    db    = get_db()
    event = db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(404, "Event not found")
    return event

@app.get("/events/{event_id}/attendees")
def get_event_attendees(event_id: int):
    db = get_db()
    rsvps = list(db.rsvps.find({"event_id": event_id}))
    if not rsvps:
        return []
    
    user_ids = [r["user_id"] for r in rsvps]
    users = list(db.users.find({"id": {"$in": user_ids}}))
    
    attendees = []
    for user in users:
        attendees.append({
            "id": user["id"],
            "name": user.get("name", "Student"),
            "department": user.get("department", "Unknown"),
            "role": user.get("role", "student")
        })
    return attendees

@app.post("/events")
def create_event(req: EventCreate):
    db = get_db()
    # Auto-increment id
    last  = db.events.find_one(sort=[("id", -1)])
    new_id = (last["id"] + 1) if last else 1
    event  = {
        "id":             new_id,
        "title":          req.title,
        "description":    req.description,
        "category":       req.category,
        "venue":          req.venue,
        "lat":            req.lat,
        "lng":            req.lng,
        "datetime":       req.datetime,
        "rsvp_count":     0,
        "organizer_id":   req.organizer_id,
        "image_url":      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
        "why_it_matters": req.why_it_matters,
    }
    db.events.insert_one(event)
    return {"event_id": new_id, "message": "Event created ✅"}

# ── Feed & Recommendations ────────────────────────────────────────────────
@app.get("/feed/{user_id}")
def get_feed(user_id: str):
    db   = get_db()
    user = db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")
    all_events = list(db.events.find({}, {"_id": 0})
                               .sort("rsvp_count", -1))
    return recommend_events(all_events, user["interests"], n=8)

@app.get("/search")
def search(q: str = Query(...)):
    db         = get_db()
    all_events = list(db.events.find({}, {"_id": 0})
                               .sort("rsvp_count", -1))
    return search_events(all_events, q, n=8)

@app.get("/surprise/{user_id}")
def surprise(user_id: str):
    db   = get_db()
    user = db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(404)
    all_events = list(db.events.find({}, {"_id": 0}))
    result     = get_surprise(all_events, user["interests"])
    if not result:
        raise HTTPException(404, "No events found")
    return result

# ── RSVP ─────────────────────────────────────────────────────────────────
@app.post("/rsvp")
def rsvp(req: RSVPReq):
    db       = get_db()
    existing = db.rsvps.find_one({
        "user_id": req.user_id, "event_id": req.event_id
    })
    event = db.events.find_one({"id": req.event_id}, {"_id": 0})
    if not event:
        raise HTTPException(404, "Event not found")

    # Conflict check
    conflict   = None
    user_rsvps = list(db.rsvps.find({"user_id": req.user_id}))
    for r in user_rsvps:
        past_event = db.events.find_one({"id": r["event_id"]}, {"_id": 0})
        if not past_event:
            continue
        try:
            t1 = datetime.fromisoformat(event["datetime"])
            t2 = datetime.fromisoformat(past_event["datetime"])
            if abs((t1 - t2).total_seconds()) < 7200:
                conflict = past_event["title"]
                break
        except:
            pass

    if existing:
        db.rsvps.delete_one({
            "user_id": req.user_id, "event_id": req.event_id
        })
        db.events.update_one(
            {"id": req.event_id},
            {"$inc": {"rsvp_count": -1}}
        )
        return {"action": "removed", "conflict": None}
    else:
        db.rsvps.insert_one({
            "user_id":  req.user_id,
            "event_id": req.event_id,
            "rsvp_at":  datetime.now().isoformat(),
        })
        db.events.update_one(
            {"id": req.event_id},
            {"$inc": {"rsvp_count": 1}}
        )
        db.users.update_one(
            {"id": req.user_id},
            {"$inc": {"points": 20}}
        )
        return {"action": "added", "conflict": conflict}

@app.get("/rsvps/{user_id}")
def get_user_rsvps(user_id: str):
    db         = get_db()
    rsvp_docs  = list(db.rsvps.find({"user_id": user_id}))
    event_ids  = [r["event_id"] for r in rsvp_docs]
    events     = list(db.events.find(
        {"id": {"$in": event_ids}}, {"_id": 0}
    ))
    return events

# ── Bookmarks ─────────────────────────────────────────────────────────────
@app.post("/bookmark")
def bookmark(req: BookmarkReq):
    db       = get_db()
    existing = db.bookmarks.find_one({
        "user_id": req.user_id, "event_id": req.event_id
    })
    if existing:
        db.bookmarks.delete_one({
            "user_id": req.user_id, "event_id": req.event_id
        })
        return {"action": "removed"}
    else:
        db.bookmarks.insert_one({
            "user_id":  req.user_id,
            "event_id": req.event_id,
        })
        db.users.update_one(
            {"id": req.user_id},
            {"$inc": {"points": 5}}
        )
        return {"action": "added"}

@app.get("/bookmarks/{user_id}")
def get_bookmarks(user_id: str):
    db        = get_db()
    bm_docs   = list(db.bookmarks.find({"user_id": user_id}))
    event_ids = [b["event_id"] for b in bm_docs]
    events    = list(db.events.find(
        {"id": {"$in": event_ids}}, {"_id": 0}
    ))
    return events

# ── Analytics ─────────────────────────────────────────────────────────────
@app.get("/analytics/{event_id}")
def analytics(event_id: int):
    db    = get_db()
    event = db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(404)

    total   = event.get("rsvp_count", 0)
    weights = [1,1,2,2,3,5,8,10,12,10,8,6,5,4,3]
    hours   = {}
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
        "event":         event,
        "total_rsvps":   total,
        "hourly":        hours,
        "departments":   departments,
        "success_score": success_score,
    }

# ── Leaderboard ───────────────────────────────────────────────────────────
@app.get("/leaderboard")
def leaderboard():
    db     = get_db()
    users  = list(db.users.find(
        {"role": "student"},
        {"_id": 0, "name": 1, "department": 1, "points": 1}
    ).sort("points", -1).limit(10))

    fake = [
        {"name":"Priya Sharma",  "department":"Computer Science","points":340},
        {"name":"Arjun Das",     "department":"Electronics",     "points":290},
        {"name":"Sneha Roy",     "department":"Computer Science","points":260},
        {"name":"Rohit Patel",   "department":"Mechanical",      "points":230},
        {"name":"Ankita Sen",    "department":"Civil",           "points":200},
    ]
    seen = {u["name"] for u in users}
    for f in fake:
        if f["name"] not in seen and len(users) < 10:
            users.append(f)
    return sorted(users, key=lambda x: x["points"], reverse=True)[:10]

# ── Portfolio ─────────────────────────────────────────────────────────────
@app.get("/portfolio/{user_id}")
def portfolio(user_id: str):
    db   = get_db()
    user = db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(404)

    rsvp_docs  = list(db.rsvps.find({"user_id": user_id}))
    event_ids  = [r["event_id"] for r in rsvp_docs]
    events     = list(db.events.find(
        {"id": {"$in": event_ids}}, {"_id": 0}
    ))

    breakdown = {}
    for e in events:
        cat = e.get("category", "other")
        breakdown[cat] = breakdown.get(cat, 0) + 1

    total_rsvps = len(events)
    return {
        "user":               user,
        "total_rsvps":        total_rsvps,
        "mar_points":         total_rsvps * 20,
        "category_breakdown": breakdown,
        "events":             events,
    }

# ── Map ───────────────────────────────────────────────────────────────────
@app.get("/map/events")
def map_events():
    db     = get_db()
    events = list(db.events.find(
        {},
        {"_id": 0, "id": 1, "title": 1, "category": 1,
         "venue": 1, "lat": 1, "lng": 1,
         "datetime": 1, "rsvp_count": 1}
    ))
    return events

# ── Calendar Export ───────────────────────────────────────────────────────
@app.get("/export/{event_id}.ics")
def export_ics(event_id: int):
    db    = get_db()
    event = db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(404)
    try:
        from ics import Calendar, Event as ICSEvent
        c  = Calendar()
        ev = ICSEvent()
        ev.name        = event["title"]
        ev.begin       = event["datetime"]
        ev.location    = event["venue"]
        ev.description = event["description"]
        c.events.add(ev)
        path = f"/tmp/event_{event_id}.ics"
        with open(path, "w") as f:
            f.writelines(c)
        return FileResponse(
            path,
            media_type="text/calendar",
            filename=f"{event['title'].replace(' ','_')}.ics"
        )
    except Exception as ex:
        raise HTTPException(500, str(ex))

# ── Chatbot ───────────────────────────────────────────────────────────────
@app.post("/chat")
def chat(req: ChatReq):
    db     = get_db()
    events = list(db.events.find({}, {"_id": 0}))
    reply  = ask_campusbot(req.message, events, req.history)
    db.chat_sessions.insert_one({
        "user_id":    req.user_id,
        "message":    req.message,
        "response":   reply,
        "created_at": datetime.now().isoformat(),
    })
    return {"reply": reply}

@app.post("/chat/stream")
async def chat_stream(req: ChatReq):
    db     = get_db()
    events = list(db.events.find({}, {"_id": 0}))
    reply  = ask_campusbot(req.message, events, req.history)

    def generate():
        words = reply.split(" ")
        for i, word in enumerate(words):
            token = word if i == len(words) - 1 else word + " "
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
