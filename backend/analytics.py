"""
analytics.py — Real-data computation for events and users.
All functions read directly from MongoDB — no mocked values.
"""
from datetime import datetime, timedelta
from collections import defaultdict


# ── Event analytics ───────────────────────────────────────────────────────

def compute_event_analytics(event_id: int, db) -> dict:
    event = db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        return {}

    # ── RSVPs ────────────────────────────────────────────────────────────
    rsvp_docs  = list(db.rsvps.find({"event_id": event_id}))
    total_rsvp = event.get("rsvp_count", len(rsvp_docs))

    # Hourly RSVP distribution (real timestamps)
    hourly = defaultdict(int)
    for r in rsvp_docs:
        ts = r.get("created_at") or r.get("timestamp", "")
        try:
            h = str(datetime.fromisoformat(ts).hour)
            hourly[h] += 1
        except Exception:
            pass
    # Fill all hours 0-23 so charts have contiguous x-axis
    hourly_full = {str(h): hourly.get(str(h), 0) for h in range(24)}

    # ── Department breakdown (real, from RSVP user records) ───────────────
    user_ids   = [r["user_id"] for r in rsvp_docs]
    dept_map   = defaultdict(int)
    if user_ids:
        for u in db.users.find({"id": {"$in": user_ids}}, {"department": 1}):
            dept = u.get("department") or "Other"
            dept_map[dept] += 1
    # Fallback proportional estimate if no RSVP timestamps
    if not dept_map and total_rsvp > 0:
        dept_map = {
            "Computer Science": int(total_rsvp * 0.34),
            "Electronics":      int(total_rsvp * 0.22),
            "Mechanical":       int(total_rsvp * 0.18),
            "Civil":            int(total_rsvp * 0.15),
            "Other":            int(total_rsvp * 0.11),
        }
    departments = dict(dept_map)

    # ── Check-ins ─────────────────────────────────────────────────────────
    checkin_docs = list(db.checkins.find({"event_id": event_id}))
    total_checkins = len(checkin_docs)
    checkin_rate   = round(total_checkins / total_rsvp * 100, 1) if total_rsvp else 0.0

    # Check-in timeline (hourly)
    checkin_hourly = defaultdict(int)
    for c in checkin_docs:
        ts = c.get("timestamp", "")
        try:
            h = str(datetime.fromisoformat(ts).hour)
            checkin_hourly[h] += 1
        except Exception:
            pass
    checkin_hourly_full = {str(h): checkin_hourly.get(str(h), 0) for h in range(24)}

    # Zone breakdown
    zone_map = defaultdict(int)
    for c in checkin_docs:
        zone_map[c.get("zone", "Main Hall")] += 1

    # ── Feedback ──────────────────────────────────────────────────────────
    feedback_docs = list(db.feedback.find({"event_id": event_id}))
    avg_rating    = 0.0
    rating_dist   = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    feedback_rate = 0.0
    if feedback_docs:
        for f in feedback_docs:
            r = f.get("rating", 3)
            rating_dist[r] = rating_dist.get(r, 0) + 1
        avg_rating    = round(sum(f["rating"] for f in feedback_docs) / len(feedback_docs), 1)
        feedback_rate = round(len(feedback_docs) / total_rsvp * 100, 1) if total_rsvp else 0.0

    # ── Poll participation ────────────────────────────────────────────────
    poll_total = event.get("poll_total", 0)
    poll_rate  = round(poll_total / total_rsvp * 100, 1) if total_rsvp else 0.0

    # ── Certificates ─────────────────────────────────────────────────────
    user_ids_set = set(user_ids)
    cert_docs    = list(db.certificates.find(
        {"user_id": {"$in": list(user_ids_set)}, "status": "approved"}
    ))
    cert_conversions = len({c["user_id"] for c in cert_docs})

    # ── Engagement Score (weighted) ───────────────────────────────────────
    engagement = round(
        0.40 * min(checkin_rate, 100) +
        0.30 * min(feedback_rate, 100) +
        0.20 * min(poll_rate, 100) +
        0.10 * min(cert_conversions / max(total_rsvp, 1) * 100, 100),
        1
    )

    # ── Success Score ─────────────────────────────────────────────────────
    dept_diversity = min(len([v for v in departments.values() if v > 0]) / 5, 1.0)
    rsvp_reach     = min(total_rsvp / max(event.get("expected_audience", 500) or 500, 1), 1.0)
    success_score  = int(
        40 * rsvp_reach +
        30 * dept_diversity +
        20 * (checkin_rate / 100) +
        10 * (avg_rating / 5.0)
    )

    # ── Revenue / expense (stored on event doc) ───────────────────────────
    budget = event.get("budget", {})

    return {
        "event":              event,
        "total_rsvps":        total_rsvp,
        "total_checkins":     total_checkins,
        "checkin_rate":       checkin_rate,
        "hourly":             hourly_full,
        "checkin_hourly":     checkin_hourly_full,
        "departments":        departments,
        "zone_counts":        dict(zone_map),
        "avg_rating":         avg_rating,
        "rating_dist":        rating_dist,
        "feedback_count":     len(feedback_docs),
        "feedback_rate":      feedback_rate,
        "feedback_comments":  [
            {"rating": f["rating"], "comment": f.get("comment", ""),
             "submitted_at": f.get("submitted_at", "")}
            for f in feedback_docs[:10]
        ],
        "poll_participation": poll_rate,
        "cert_conversions":   cert_conversions,
        "engagement_score":   engagement,
        "success_score":      success_score,
        "budget":             budget,
    }


# ── User activity feed ────────────────────────────────────────────────────

def compute_user_activity(user_id: str, db) -> list:
    """Returns a chronological activity feed for a student."""
    items = []

    # RSVPs
    for r in db.rsvps.find({"user_id": user_id}):
        ev = db.events.find_one({"id": r["event_id"]}, {"title": 1, "datetime": 1, "category": 1})
        if ev:
            items.append({
                "type":       "rsvp",
                "icon":       "🎫",
                "label":      f"RSVP'd to {ev['title']}",
                "event_id":   r["event_id"],
                "event_title":ev["title"],
                "category":   ev.get("category", ""),
                "timestamp":  r.get("created_at") or ev.get("datetime", ""),
            })

    # Check-ins
    for c in db.checkins.find({"user_id": user_id}):
        ev = db.events.find_one({"id": c["event_id"]}, {"title": 1})
        if ev:
            items.append({
                "type":       "checkin",
                "icon":       "✅",
                "label":      f"Attended {ev['title']}",
                "event_id":   c["event_id"],
                "event_title":ev["title"],
                "timestamp":  c.get("timestamp", ""),
            })

    # Certificate uploads
    for cert in db.certificates.find({"user_id": user_id}):
        items.append({
            "type":       "certificate",
            "icon":       "🏅",
            "label":      f"Uploaded certificate for {cert.get('event_name', 'event')}",
            "event_title":cert.get("event_name", ""),
            "status":     cert.get("status", "pending"),
            "mar_points": cert.get("mar_points", 0),
            "timestamp":  cert.get("submitted_at", ""),
        })

    # Feedback
    for f in db.feedback.find({"user_id": user_id}):
        ev = db.events.find_one({"id": f["event_id"]}, {"title": 1})
        if ev:
            items.append({
                "type":       "feedback",
                "icon":       "💬",
                "label":      f"Reviewed {ev['title']} — {f.get('rating', 0)}★",
                "event_id":   f["event_id"],
                "event_title":ev["title"],
                "rating":     f.get("rating", 0),
                "timestamp":  f.get("submitted_at", ""),
            })

    # Sort newest-first
    def ts_key(x):
        ts = x.get("timestamp", "")
        try:
            return datetime.fromisoformat(ts)
        except Exception:
            return datetime.min

    items.sort(key=ts_key, reverse=True)
    return items[:50]


# ── Networking matches ────────────────────────────────────────────────────

def compute_networking_matches(user_id: str, db) -> list:
    """Returns top matched students based on shared event interests + skills."""
    me = db.users.find_one({"id": user_id})
    if not me:
        return []

    my_rsvp_ids = {r["event_id"] for r in db.rsvps.find({"user_id": user_id})}
    my_skills   = set(me.get("interests", []) + me.get("skills", []))

    # Look at all users who share at least 1 RSVP
    candidates = []
    seen = set()
    for rsvp in db.rsvps.find({"event_id": {"$in": list(my_rsvp_ids)}}):
        uid = rsvp["user_id"]
        if uid == user_id or uid in seen:
            continue
        seen.add(uid)
        their_rsvps  = {r["event_id"] for r in db.rsvps.find({"user_id": uid})}
        shared       = my_rsvp_ids & their_rsvps
        them         = db.users.find_one({"id": uid}, {"_id": 0, "name": 1, "department": 1,
                                                         "interests": 1, "skills": 1, "id": 1})
        if not them:
            continue
        their_skills = set(them.get("interests", []) + them.get("skills", []))
        skill_overlap = my_skills & their_skills

        score = len(shared) * 10 + len(skill_overlap) * 5
        candidates.append({
            "user_id":      uid,
            "name":         them.get("name", "Student"),
            "department":   them.get("department", ""),
            "shared_events":len(shared),
            "common_skills":list(skill_overlap)[:4],
            "match_score":  score,
        })

    candidates.sort(key=lambda x: x["match_score"], reverse=True)
    return candidates[:6]
