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
from external_events import get_external_events
from certificates import (
    save_certificate, get_user_certificates,
    get_all_pending, approve_certificate,
    reject_certificate, get_certificate_file
)
from analytics import (
    compute_event_analytics,
    compute_user_activity,
    compute_networking_matches,
)

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
    print("Eventify API started")

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
    title:             str
    description:       str
    category:          str
    venue:             str
    datetime:          str
    why_it_matters:    Optional[str]       = ""
    lat:               Optional[float]     = 22.578
    lng:               Optional[float]     = 88.432
    organizer_id:      str
    # Rich event metadata
    event_type:        Optional[str]       = "campus"  # campus | hackathon | workshop | competition | conference | cultural | internship | placement
    eligibility:       Optional[str]       = ""
    required_skills:   Optional[List[str]] = []
    expected_audience: Optional[int]       = 0
    prizes:            Optional[str]       = ""
    registration_link: Optional[str]       = ""
    agenda:            Optional[List]      = []        # [{time, session, speaker?}]
    tags:              Optional[List[str]] = []
    problems:          Optional[List[dict]] = []       # [{title, description}]
    sub_events:        Optional[List[dict]] = []       # [{title, time, venue, description}]
    sponsors:          Optional[List[dict]] = []       # [{name, logo_url, tier}]
    contact_email:     Optional[str]       = ""
    contact_phone:     Optional[str]       = ""
    brochure_url:      Optional[str]       = ""

class ChatReq(BaseModel):
    user_id: str
    message: str
    history: Optional[List] = []

class CertUploadReq(BaseModel):
    user_id:     str
    event_name:  str
    issuer:      str
    event_date:  str
    cert_type:   str
    file_base64: str
    file_name:   str

class CertReviewReq(BaseModel):
    admin_id:   str
    cert_id:    str
    action:     str
    mar_points: int = 0
    admin_note: str = ""

class LiveUpdateReq(BaseModel):
    organizer_id:    str
    phase:           str              # "before" | "live" | "after"
    current_session: Optional[str]       = ""
    next_session:    Optional[str]       = ""
    announcement:    Optional[str]       = ""
    poll_question:   Optional[str]       = ""
    poll_options:    Optional[List[str]] = []
    live_count:      Optional[int]       = 0

class PollVoteReq(BaseModel):
    user_id: str
    option:  str

class AfterEventReq(BaseModel):
    organizer_id: str
    winners:      Optional[List[dict]]  = []   # [{rank, name, prize?}]
    resources:    Optional[List[dict]]  = []   # [{label, url, icon?}]
    recap:        Optional[str]         = ""
    photos:       Optional[List[str]]   = []   # image URLs
    final_count:  Optional[int]         = 0

class FeedbackReq(BaseModel):
    user_id: str
    rating:  int        # 1-5
    comment: str = ""

class CheckInReq(BaseModel):
    user_id:  str
    zone:     str = "Main Hall"  # Main Hall | Registration | Food Court | Networking

class OperationsReq(BaseModel):
    organizer_id: str
    category:     str   # food | security | parking
    key:          str   # e.g. "Lunch", "Main Gate", "Lot A"
    value:        str   # e.g. "serving", "ok", "50 slots"
    count:        int   = 0

class HelpReq(BaseModel):
    user_id:  str
    category: str = "query"   # lost-item | emergency | query | medical
    message:  str

class BudgetUpdateReq(BaseModel):
    organizer_id: str
    revenue:      Optional[List[dict]] = []   # [{label, amount}]
    expenses:     Optional[List[dict]] = []   # [{label, amount}]
    sponsors:     Optional[List[dict]] = []   # [{name, logo_url, tier, amount}]

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
    last   = db.events.find_one(sort=[("id", -1)])
    new_id = (last["id"] + 1) if last else 1
    event  = {
        "id":               new_id,
        "title":            req.title,
        "description":      req.description,
        "category":         req.category,
        "venue":            req.venue,
        "lat":              req.lat,
        "lng":              req.lng,
        "datetime":         req.datetime,
        "rsvp_count":       0,
        "organizer_id":     req.organizer_id,
        "image_url":        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
        "why_it_matters":   req.why_it_matters,
        # Rich metadata
        "event_type":        req.event_type,
        "eligibility":       req.eligibility,
        "required_skills":   req.required_skills,
        "expected_audience": req.expected_audience,
        "prizes":            req.prizes,
        "registration_link": req.registration_link,
        "agenda":            req.agenda,
        "tags":              req.tags,
        "problems":          req.problems,
        "sub_events":        req.sub_events,
        "sponsors":          req.sponsors,
        "contact_email":     req.contact_email,
        "contact_phone":     req.contact_phone,
        "brochure_url":      req.brochure_url,
        # Phase + live fields (managed separately via PATCH)
        "phase":             "before",
        "current_session":   "",
        "next_session":      "",
        "announcement":      "",
        "poll_question":     "",
        "poll_options":      [],
        "poll_counts":       {},
        "poll_total":        0,
        "live_count":        0,
        # After-event fields
        "winners":           [],
        "resources":         [],
        "recap":             "",
        "photos":            [],
        "final_count":       0,
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
    return recommend_events(all_events, user.get("interests", []), n=8)

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
    result     = get_surprise(all_events, user.get("interests", []))
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

# ── Analytics (real data) ────────────────────────────────────────────────
@app.get("/analytics/{event_id}")
def analytics(event_id: int):
    db = get_db()
    data = compute_event_analytics(event_id, db)
    if not data:
        raise HTTPException(404, "Event not found")
    return data

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

# ── External Events ───────────────────────────────────────────────────────

@app.get("/external-events")
def external_events(
    source:  Optional[str] = None,
    refresh: bool          = False,
):
    events = get_external_events(force_refresh=refresh)
    if source and source != "all":
        events = [e for e in events if e.get("source") == source]
    return events

@app.get("/external-events/refresh")
def refresh_external():
    events = get_external_events(force_refresh=True)
    live   = sum(1 for e in events if e.get("is_live_data"))
    static = sum(1 for e in events if not e.get("is_live_data"))
    return {
        "total":   len(events),
        "live":    live,
        "static":  static,
        "message": "Refreshed ✅"
    }

@app.get("/all-events")
def all_events_unified(category: Optional[str] = None):
    """Campus events + external events in one unified feed."""
    db = get_db()

    # Campus events
    query  = {"category": category} if category else {}
    campus = list(db.events.find(query, {"_id": 0})
                            .sort("rsvp_count", -1))
    for e in campus:
        e["source"]       = "campus"
        e["source_label"] = "Campus"
        e["external"]     = False

    # External events
    external = get_external_events()
    if category:
        external = [e for e in external if e.get("category") == category]

    return {
        "campus":   campus,
        "external": external,
        "total":    len(campus) + len(external),
    }

# ── Certificates ──────────────────────────────────────────────────────────

@app.post("/certificates/upload")
def upload_certificate(req: CertUploadReq):
    # Validate base64 size (max ~4MB file)
    file_size = len(req.file_base64) * 3 / 4 / (1024 * 1024)
    if file_size > 4:
        raise HTTPException(400, "File too large. Max 4MB.")

    cert_id = save_certificate(
        user_id    = req.user_id,
        event_name = req.event_name,
        issuer     = req.issuer,
        event_date = req.event_date,
        cert_type  = req.cert_type,
        file_base64= req.file_base64,
        file_name  = req.file_name,
    )
    return {
        "cert_id": cert_id,
        "message": "Certificate submitted for admin review ✅",
        "status":  "pending"
    }

@app.get("/certificates/user/{user_id}")
def user_certificates(user_id: str):
    certs      = get_user_certificates(user_id)
    total_mar  = sum(c.get("mar_points", 0) for c in certs
                     if c.get("status") == "approved")
    pending    = sum(1 for c in certs if c.get("status") == "pending")
    return {
        "certificates": certs,
        "total_mar_points": total_mar,
        "pending_count":    pending,
    }

@app.get("/certificates/download/{cert_id}/{user_id}")
def download_certificate(cert_id: str, user_id: str):
    cert = get_certificate_file(cert_id, user_id)
    if not cert:
        raise HTTPException(404, "Certificate not found")
    return {
        "file_base64": cert["file_base64"],
        "file_name":   cert["file_name"],
    }

# ── Admin endpoints ───────────────────────────────────────────────────────

@app.get("/admin/certificates/pending")
def pending_certificates(admin_id: str = "org-001"):
    db   = get_db()
    user = db.users.find_one({"id": admin_id})
    if not user or user.get("role") not in ("organizer", "admin"):
        raise HTTPException(403, "Admin access required")
    return get_all_pending(admin_id)

@app.post("/admin/certificates/review")
def review_certificate(req: CertReviewReq):
    db   = get_db()
    user = db.users.find_one({"id": req.admin_id})
    if not user or user.get("role") not in ("organizer", "admin"):
        raise HTTPException(403, "Admin access required")

    if req.action == "approve":
        ok = approve_certificate(req.cert_id, req.mar_points, req.admin_note)
    elif req.action == "reject":
        ok = reject_certificate(req.cert_id, req.admin_note)
    else:
        raise HTTPException(400, "action must be approve or reject")

    if not ok:
        raise HTTPException(404, "Certificate not found")
    return {"message": f"Certificate {req.action}d ✅"}

@app.get("/admin/stats")
def admin_stats(admin_id: str = "org-001"):
    db = get_db()
    return {
        "total_users":        db.users.count_documents({"role": "student"}),
        "total_events":       db.events.count_documents({}),
        "total_rsvps":        db.rsvps.count_documents({}),
        "pending_certs":      db.certificates.count_documents({"status": "pending"}),
        "approved_certs":     db.certificates.count_documents({"status": "approved"}),
        "total_mar_awarded":  sum(
            c.get("mar_points", 0) for c in
            db.certificates.find({"status": "approved"}, {"mar_points": 1})
        ),
    }

# ── Event Lifecycle (Live + After) ────────────────────────────────────────

@app.patch("/events/{event_id}/live")
def update_live(event_id: int, req: LiveUpdateReq):
    """Organizer pushes live state — current session, announcement, poll."""
    db    = get_db()
    event = db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(404, "Event not found")

    update: dict = {"phase": req.phase}
    if req.current_session is not None: update["current_session"] = req.current_session
    if req.next_session    is not None: update["next_session"]    = req.next_session
    if req.announcement    is not None: update["announcement"]    = req.announcement
    if req.live_count                 : update["live_count"]      = req.live_count
    # New poll — reset counts
    if req.poll_question:
        update["poll_question"] = req.poll_question
        update["poll_options"]  = req.poll_options
        update["poll_counts"]   = {}
        update["poll_total"]    = 0

    db.events.update_one({"id": event_id}, {"$set": update})
    return {"message": "Live state updated ✅"}

@app.post("/events/{event_id}/poll-vote")
def poll_vote(event_id: int, req: PollVoteReq):
    """Student votes in the live poll — one vote per user per poll."""
    db = get_db()
    # Guard duplicate votes via a votes collection
    existing = db.poll_votes.find_one({"event_id": event_id, "user_id": req.user_id})
    if existing:
        raise HTTPException(400, "Already voted")
    db.poll_votes.insert_one({"event_id": event_id, "user_id": req.user_id, "option": req.option})
    db.events.update_one(
        {"id": event_id},
        {
            "$inc": {
                f"poll_counts.{req.option}": 1,
                "poll_total": 1
            }
        }
    )
    return {"message": "Vote recorded ✅"}

@app.patch("/events/{event_id}/after")
def after_event(event_id: int, req: AfterEventReq):
    """Organizer posts post-event content — winners, resources, recap, photos."""
    db    = get_db()
    event = db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(404, "Event not found")

    db.events.update_one(
        {"id": event_id},
        {"$set": {
            "phase":       "after",
            "winners":     req.winners,
            "resources":   req.resources,
            "recap":       req.recap,
            "photos":      req.photos,
            "final_count": req.final_count or event.get("rsvp_count", 0),
        }}
    )
    return {"message": "After-event content published ✅"}

@app.post("/events/{event_id}/feedback")
def submit_feedback(event_id: int, req: FeedbackReq):
    """Student submits a star rating + comment after an event."""
    db = get_db()
    # One feedback per user per event
    existing = db.feedback.find_one({"event_id": event_id, "user_id": req.user_id})
    if existing:
        raise HTTPException(400, "Feedback already submitted")
    if not (1 <= req.rating <= 5):
        raise HTTPException(400, "Rating must be 1-5")
    db.feedback.insert_one({
        "event_id":    event_id,
        "user_id":     req.user_id,
        "rating":      req.rating,
        "comment":     req.comment,
        "submitted_at": datetime.now().isoformat(),
    })
    return {"message": "Feedback submitted ✅"}

@app.get("/events/{event_id}/feedback")
def get_event_feedback(event_id: int):
    """Returns average rating + all comments for an event."""
    db    = get_db()
    items = list(db.feedback.find({"event_id": event_id}, {"_id": 0, "user_id": 0}))
    if not items:
        return {"average": 0, "count": 0, "comments": []}
    avg = sum(i["rating"] for i in items) / len(items)
    return {
        "average":  round(avg, 1),
        "count":    len(items),
        "comments": [{"rating": i["rating"], "comment": i["comment"],
                      "submitted_at": i["submitted_at"]} for i in items],
    }

@app.get("/events/organizer/{organizer_id}")
def organizer_events(organizer_id: str):
    """Returns all events created by a specific organizer."""
    db = get_db()
    events = list(db.events.find({"organizer_id": organizer_id}, {"_id": 0})
                            .sort("datetime", -1))
    return events


# ── Operations and Advanced Features Endpoints ──────────────────────────────

@app.post("/events/{event_id}/checkin")
def check_in_student(event_id: int, req: CheckInReq):
    """Logs a student check-in with a specific zone and timestamp."""
    db = get_db()
    # Check if event exists
    event = db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(404, "Event not found")

    # Check if student exists
    student = db.users.find_one({"id": req.user_id})
    if not student:
        raise HTTPException(404, "Student not found")

    # Record check-in
    now_str = datetime.now().isoformat()
    checkin_doc = {
        "event_id": event_id,
        "user_id": req.user_id,
        "zone": req.zone,
        "timestamp": now_str
    }
    
    # We allow re-checking in to update zone or log multiple visits, 
    # but let's check if they have already checked in at all.
    existing = db.checkins.find_one({"event_id": event_id, "user_id": req.user_id})
    if not existing:
        db.checkins.insert_one(checkin_doc)
        # Log activity
        db.activity_log.insert_one({
            "user_id": req.user_id,
            "action": "checkin",
            "event_id": event_id,
            "event_title": event["title"],
            "timestamp": now_str
        })
        # Award points for attendance (e.g. 50 points)
        db.users.update_one({"id": req.user_id}, {"$inc": {"points": 50}})
    else:
        db.checkins.update_one(
            {"event_id": event_id, "user_id": req.user_id},
            {"$set": {"zone": req.zone, "timestamp": now_str}}
        )

    return {"message": "Check-in successful! ✅", "zone": req.zone}


@app.get("/events/{event_id}/checkins")
def get_event_checkins(event_id: int):
    """Returns all check-in records for an event including student details."""
    db = get_db()
    checkins = list(db.checkins.find({"event_id": event_id}, {"_id": 0}))
    
    # Enrich with user name & department
    enriched = []
    for c in checkins:
        user = db.users.find_one({"id": c["user_id"]}, {"name": 1, "department": 1, "_id": 0})
        enriched.append({
            "user_id": c["user_id"],
            "zone": c["zone"],
            "timestamp": c["timestamp"],
            "name": user.get("name", "Unknown student") if user else "Unknown student",
            "department": user.get("department", "N/A") if user else "N/A"
        })
    return enriched


@app.get("/events/{event_id}/crowd")
def get_crowd_monitoring(event_id: int):
    """Calculates zone occupancy levels and returns heatmap-friendly crowd data."""
    db = get_db()
    checkins = list(db.checkins.find({"event_id": event_id}))
    
    # Count occupancy per zone
    zones = ["Main Hall", "Registration", "Food Court", "Networking"]
    counts = {z: 0 for z in zones}
    for c in checkins:
        zone = c.get("zone", "Main Hall")
        if zone in counts:
            counts[zone] += 1
        else:
            counts[zone] = counts.get(zone, 0) + 1
            
    total = len(checkins)
    
    return {
        "total_checked_in": total,
        "zones": [
            {
                "name": z,
                "count": counts[z],
                "percentage": round((counts[z] / total * 100), 1) if total > 0 else 0,
                "status": "High" if (counts[z] > 50) else "Medium" if (counts[z] > 15) else "Low"
            }
            for z in counts
        ]
    }


@app.post("/events/{event_id}/operations")
def update_operation_status(event_id: int, req: OperationsReq):
    """Creates or updates a status card for F&B, security, or parking."""
    db = get_db()
    # Check authorization
    user = db.users.find_one({"id": req.organizer_id})
    if not user or user.get("role") not in ("organizer", "admin"):
        raise HTTPException(403, "Only organizers can update operations")

    now_str = datetime.now().isoformat()
    db.operations.update_one(
        {"event_id": event_id, "category": req.category, "key": req.key},
        {
            "$set": {
                "value": req.value,
                "count": req.count,
                "updated_at": now_str
            }
        },
        upsert=True
    )
    return {"message": f"Updated operations for {req.category} -> {req.key} ✅"}


@app.get("/events/{event_id}/operations")
def get_operations_status(event_id: int):
    """Fetches F&B, security, and parking status lists."""
    db = get_db()
    ops = list(db.operations.find({"event_id": event_id}, {"_id": 0}))
    return ops


@app.post("/events/{event_id}/help")
def submit_help_request(event_id: int, req: HelpReq):
    """Submits a help/support ticket for an event."""
    db = get_db()
    # Generate simple incremented request ID
    last = db.help_requests.find_one(sort=[("id", -1)])
    new_id = (last["id"] + 1) if last else 1
    
    now_str = datetime.now().isoformat()
    doc = {
        "id": new_id,
        "event_id": event_id,
        "user_id": req.user_id,
        "category": req.category,
        "message": req.message,
        "resolved": False,
        "created_at": now_str
    }
    db.help_requests.insert_one(doc)
    return {"message": "Help desk request submitted! Support will contact you shortly. 🆘", "request_id": new_id}


@app.get("/events/{event_id}/help")
def get_help_requests(event_id: int):
    """Organizer gets all help desk requests."""
    db = get_db()
    requests = list(db.help_requests.find({"event_id": event_id}, {"_id": 0}))
    
    # Enrich with user details
    enriched = []
    for r in requests:
        user = db.users.find_one({"id": r["user_id"]}, {"name": 1, "department": 1, "_id": 0})
        enriched.append({
            **r,
            "name": user.get("name", "Student") if user else "Student",
            "department": user.get("department", "CS") if user else "CS"
        })
    return enriched


@app.patch("/events/{event_id}/help/{req_id}")
def resolve_help_request(event_id: int, req_id: int):
    """Marks a help request ticket as resolved."""
    db = get_db()
    res = db.help_requests.update_one(
        {"event_id": event_id, "id": req_id},
        {"$set": {"resolved": True}}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Help request not found")
    return {"message": "Help request marked as resolved! ✅"}


@app.get("/users/{user_id}/activity")
def get_user_activity_feed(user_id: str):
    """Computes and returns a rich timeline activity feed for a student."""
    db = get_db()
    return compute_user_activity(user_id, db)


@app.get("/users/{user_id}/networking-matches")
def get_user_networking_matches(user_id: str):
    """Finds students with similar event RSVP habits and overlapping interests."""
    db = get_db()
    return compute_networking_matches(user_id, db)


@app.post("/events/{event_id}/budget")
def update_event_budget(event_id: int, req: BudgetUpdateReq):
    """Updates event revenue, expense, and sponsor tracking arrays."""
    db = get_db()
    # Check if event exists
    event = db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(404, "Event not found")
        
    db.events.update_one(
        {"id": event_id},
        {
            "$set": {
                "budget": {
                    "revenue": req.revenue,
                    "expenses": req.expenses,
                    "sponsors": req.sponsors
                }
            }
        }
    )
    return {"message": "Budget and sponsor metrics updated! 📊"}


# ── Event Operating System - Custom Extensions ──────────────────────────────

class QuizCreate(BaseModel):
    organizer_id: str
    question: str
    options: List[str]
    correct_option: str
    points: int = 50

class QuizSubmit(BaseModel):
    user_id: str
    quiz_id: str
    selected_option: str

class PhotoUpload(BaseModel):
    user_id: str
    photo_base64: str
    name: Optional[str] = "Attendee Photo"

class PhotoReview(BaseModel):
    organizer_id: str
    approved: bool

class EventDetailUpdate(BaseModel):
    organizer_id: str
    description: Optional[str] = None
    why_it_matters: Optional[str] = None
    eligibility: Optional[str] = None
    prizes: Optional[str] = None
    registration_link: Optional[str] = None
    tags: Optional[List[str]] = None
    rules: Optional[str] = None
    faq: Optional[List[dict]] = None
    hackathon_problem_statements: Optional[str] = None
    hackathon_tracks: Optional[List[str]] = None
    hackathon_judging_criteria: Optional[str] = None
    hackathon_team_size: Optional[str] = None
    workshop_learning_outcomes: Optional[List[str]] = None
    workshop_requirements: Optional[List[str]] = None
    cultural_theme: Optional[str] = None
    cultural_activities: Optional[List[str]] = None
    cultural_dress_code: Optional[str] = None
    cultural_rewards: Optional[str] = None
    competition_format: Optional[str] = None

# Quizzes
@app.get("/events/{event_id}/quizzes")
def get_event_quizzes(event_id: int):
    db = get_db()
    quizzes = list(db.quizzes.find({"event_id": event_id}, {"_id": 0}))
    return quizzes

@app.post("/events/{event_id}/quiz")
def create_event_quiz(event_id: int, req: QuizCreate):
    db = get_db()
    user = db.users.find_one({"id": req.organizer_id})
    if not user or user.get("role") not in ("organizer", "admin"):
        raise HTTPException(403, "Only organizers can create quizzes")
        
    quiz_id = str(uuid.uuid4())
    doc = {
        "id": quiz_id,
        "event_id": event_id,
        "question": req.question,
        "options": req.options,
        "correct_option": req.correct_option,
        "points": req.points,
        "created_at": datetime.now().isoformat()
    }
    db.quizzes.insert_one(doc)
    return {"message": "Quiz created successfully! 📝", "quiz_id": quiz_id}

@app.post("/events/{event_id}/quiz-submit")
def submit_quiz_answer(event_id: int, req: QuizSubmit):
    db = get_db()
    quiz = db.quizzes.find_one({"event_id": event_id, "id": req.quiz_id})
    if not quiz:
        raise HTTPException(404, "Quiz not found")
        
    existing = db.quiz_submissions.find_one({
        "event_id": event_id, "quiz_id": req.quiz_id, "user_id": req.user_id
    })
    if existing:
        raise HTTPException(400, "You have already attempted this quiz")
        
    is_correct = req.selected_option == quiz["correct_option"]
    points_earned = quiz["points"] if is_correct else 0
    
    doc = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "quiz_id": req.quiz_id,
        "user_id": req.user_id,
        "selected_option": req.selected_option,
        "points_earned": points_earned,
        "timestamp": datetime.now().isoformat()
    }
    db.quiz_submissions.insert_one(doc)
    
    if points_earned > 0:
        db.users.update_one({"id": req.user_id}, {"$inc": {"points": points_earned}})
        # Add to student activity log
        db.activity_log.insert_one({
            "user_id": req.user_id,
            "action": "quiz_complete",
            "event_id": event_id,
            "event_title": f"Quiz for Event #{event_id}",
            "timestamp": datetime.now().isoformat()
        })
        
    return {
        "correct": is_correct,
        "points_earned": points_earned,
        "correct_option": quiz["correct_option"],
        "message": "Correct! +XP earned! 🎉" if is_correct else "Incorrect answer. Keep trying other activities! 👍"
    }

@app.get("/events/{event_id}/quiz-leaderboard")
def get_quiz_leaderboard(event_id: int):
    db = get_db()
    # Sum quiz points per user for this event
    pipeline = [
        {"$match": {"event_id": event_id}},
        {"$group": {"_id": "$user_id", "total_points": {"$sum": "$points_earned"}}},
        {"$sort": {"total_points": -1}},
        {"$limit": 10}
    ]
    results = list(db.quiz_submissions.aggregate(pipeline))
    leaderboard = []
    for idx, r in enumerate(results):
        user = db.users.find_one({"id": r["_id"]}, {"name": 1, "department": 1, "_id": 0})
        leaderboard.append({
            "rank": idx + 1,
            "name": user.get("name", "Student") if user else "Student",
            "department": user.get("department", "CS") if user else "CS",
            "points": r["total_points"]
        })
    return leaderboard

# Photos
@app.post("/events/{event_id}/photos/upload")
def upload_event_photo(event_id: int, req: PhotoUpload):
    db = get_db()
    user = db.users.find_one({"id": req.user_id})
    if not user:
        raise HTTPException(404, "User not found")
        
    photo_id = str(uuid.uuid4())
    doc = {
        "id": photo_id,
        "event_id": event_id,
        "user_id": req.user_id,
        "name": user.get("name", "Attendee"),
        "photo_base64": req.photo_base64,
        "approved": False,
        "uploaded_at": datetime.now().isoformat()
    }
    db.event_photos.insert_one(doc)
    return {"message": "Photo uploaded successfully! Pending organizer approval. 📸", "photo_id": photo_id}

@app.get("/events/{event_id}/photos")
def get_event_photos(event_id: int):
    db = get_db()
    photos = list(db.event_photos.find({"event_id": event_id, "approved": True}, {"_id": 0, "photo_base64": 1, "id": 1, "name": 1, "uploaded_at": 1}))
    formatted = []
    for p in photos:
        formatted.append({
            "id": p["id"],
            "url": p["photo_base64"] if p["photo_base64"].startswith("data:") else f"data:image/jpeg;base64,{p['photo_base64']}",
            "name": p.get("name", "Attendee"),
            "uploaded_at": p.get("uploaded_at", "")
        })
    return formatted

@app.get("/events/{event_id}/photos/pending")
def get_pending_photos(event_id: int):
    db = get_db()
    photos = list(db.event_photos.find({"event_id": event_id, "approved": False}, {"_id": 0}))
    formatted = []
    for p in photos:
        formatted.append({
            "id": p["id"],
            "url": p["photo_base64"] if p["photo_base64"].startswith("data:") else f"data:image/jpeg;base64,{p['photo_base64']}",
            "name": p.get("name", "Attendee"),
            "uploaded_at": p.get("uploaded_at", ""),
            "user_id": p["user_id"]
        })
    return formatted

@app.post("/events/{event_id}/photos/{photo_id}/review")
def review_event_photo(event_id: int, photo_id: str, req: PhotoReview):
    db = get_db()
    user = db.users.find_one({"id": req.organizer_id})
    if not user or user.get("role") not in ("organizer", "admin"):
        raise HTTPException(403, "Only organizers can review photos")
        
    if req.approved:
        db.event_photos.update_one({"event_id": event_id, "id": photo_id}, {"$set": {"approved": True}})
        # Give student points for photo contribution
        photo = db.event_photos.find_one({"event_id": event_id, "id": photo_id})
        if photo:
            db.users.update_one({"id": photo["user_id"]}, {"$inc": {"points": 10}})
        return {"message": "Photo approved and added to gallery! 📸"}
    else:
        db.event_photos.delete_one({"event_id": event_id, "id": photo_id})
        return {"message": "Photo rejected and deleted."}

# Rich Event Details Edit
@app.patch("/events/{event_id}/details")
def update_event_details(event_id: int, req: EventDetailUpdate):
    db = get_db()
    user = db.users.find_one({"id": req.organizer_id})
    if not user or user.get("role") not in ("organizer", "admin"):
        raise HTTPException(403, "Only organizers can update event details")
        
    event = db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(404, "Event not found")
        
    update_data = {}
    
    # Standard fields
    if req.description is not None: update_data["description"] = req.description
    if req.why_it_matters is not None: update_data["why_it_matters"] = req.why_it_matters
    if req.eligibility is not None: update_data["eligibility"] = req.eligibility
    if req.prizes is not None: update_data["prizes"] = req.prizes
    if req.registration_link is not None: update_data["registration_link"] = req.registration_link
    if req.tags is not None: update_data["tags"] = req.tags
    if req.rules is not None: update_data["rules"] = req.rules
    if req.faq is not None: update_data["faq"] = req.faq
    
    # Specific details
    specifics = {}
    if req.hackathon_problem_statements is not None: specifics["hackathon_problem_statements"] = req.hackathon_problem_statements
    if req.hackathon_tracks is not None: specifics["hackathon_tracks"] = req.hackathon_tracks
    if req.hackathon_judging_criteria is not None: specifics["hackathon_judging_criteria"] = req.hackathon_judging_criteria
    if req.hackathon_team_size is not None: specifics["hackathon_team_size"] = req.hackathon_team_size
    if req.workshop_learning_outcomes is not None: specifics["workshop_learning_outcomes"] = req.workshop_learning_outcomes
    if req.workshop_requirements is not None: specifics["workshop_requirements"] = req.workshop_requirements
    if req.cultural_theme is not None: specifics["cultural_theme"] = req.cultural_theme
    if req.cultural_activities is not None: specifics["cultural_activities"] = req.cultural_activities
    if req.cultural_dress_code is not None: specifics["cultural_dress_code"] = req.cultural_dress_code
    if req.cultural_rewards is not None: specifics["cultural_rewards"] = req.cultural_rewards
    if req.competition_format is not None: specifics["competition_format"] = req.competition_format
    
    if specifics:
        existing_specifics = event.get("specifics", {})
        existing_specifics.update(specifics)
        update_data["specifics"] = existing_specifics
        
    if update_data:
        db.events.update_one({"id": event_id}, {"$set": update_data})
        
    return {"message": "Event details updated successfully! 🛠️"}


# ── Meal / Food Management System ──

class ClaimMealReq(BaseModel):
    user_id: str
    meal: str  # "Breakfast" | "Lunch" | "Dinner" | "Snacks"

class VerifyMealReq(BaseModel):
    organizer_id: str
    coupon_id: str

@app.post("/events/{event_id}/claim-meal")
def claim_event_meal(event_id: int, req: ClaimMealReq):
    db = get_db()
    
    # 1. Enforce physical check-in status
    checked_in = db.checkins.find_one({"event_id": event_id, "user_id": req.user_id})
    if not checked_in:
        raise HTTPException(400, "You must check-in to the event at a room zone first to unlock meal coupons!")
        
    # 2. Check if already claimed for this specific meal
    existing = db.food_coupons.find_one({
        "event_id": event_id,
        "user_id": req.user_id,
        "meal": req.meal
    })
    if existing:
        return {
            "coupon_id": existing["id"],
            "meal": existing["meal"],
            "claimed_at": existing["claimed_at"],
            "verified": existing.get("verified", False),
            "message": f"You have already claimed your {req.meal} coupon! 🎫"
        }
        
    coupon_id = f"MEAL-{event_id}-{req.user_id[:6]}-{req.meal.upper()}"
    doc = {
        "id": coupon_id,
        "event_id": event_id,
        "user_id": req.user_id,
        "meal": req.meal,
        "claimed_at": datetime.now().isoformat(),
        "verified": False
    }
    db.food_coupons.insert_one(doc)
    
    # Update active meal servings count in operations
    db.operations.update_one(
        {"event_id": event_id, "category": "food", "key": req.meal},
        {"$inc": {"count": 1}},
        upsert=True
    )
    
    return {
        "coupon_id": coupon_id,
        "meal": req.meal,
        "claimed_at": doc["claimed_at"],
        "verified": False,
        "message": f"Successfully generated {req.meal} coupon! 🍛"
      }

@app.get("/events/{event_id}/meals/{user_id}")
def get_user_claimed_meals(event_id: int, user_id: str):
    db = get_db()
    coupons = list(db.food_coupons.find({"event_id": event_id, "user_id": user_id}, {"_id": 0}))
    return coupons

@app.post("/events/{event_id}/verify-meal")
def verify_event_meal(event_id: int, req: VerifyMealReq):
    db = get_db()
    # Validate organizer role
    user = db.users.find_one({"id": req.organizer_id})
    if not user or user.get("role") not in ("organizer", "admin"):
        raise HTTPException(403, "Only organizers can verify food coupons")
        
    coupon = db.food_coupons.find_one({"event_id": event_id, "id": req.coupon_id})
    if not coupon:
        raise HTTPException(404, "Invalid or non-existent meal coupon")
        
    if coupon.get("verified"):
        raise HTTPException(400, "This meal coupon has already been used and verified!")
        
    db.food_coupons.update_one(
        {"event_id": event_id, "id": req.coupon_id},
        {"$set": {"verified": True, "verified_at": datetime.now().isoformat()}}
    )
    return {"message": "Food coupon verified successfully! Serve meal. 🍲", "meal": coupon["meal"]}




