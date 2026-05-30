import requests
import json
from datetime import datetime, timedelta
from database import get_db

CACHE_DURATION_MINUTES = 30

# ── Fetch helpers ──────────────────────────────────────────────────────

def _fetch_devfolio():
    """Fetch hackathons from Devfolio public API."""
    try:
        res = requests.get(
            "https://api.devfolio.co/api/hackathons?page=1&per_page=10",
            headers={"Accept": "application/json"},
            timeout=8
        )
        res.raise_for_status()
        data = res.json()
        events = []
        for h in data.get("hackathons", [])[:8]:
            events.append({
                "id":           f"devfolio_{h.get('slug','')}",
                "title":        h.get("name", ""),
                "description":  h.get("tagline") or h.get("description", "")[:200],
                "category":     "tech",
                "venue":        "Online" if h.get("is_online") else h.get("city", "India"),
                "datetime":     h.get("starts_at", "")[:16].replace("T", " "),
                "rsvp_count":   h.get("total_applications", 0),
                "image_url":    h.get("cover_image_url") or "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400",
                "why_it_matters": "External hackathon — earns MAR points",
                "source":       "devfolio",
                "source_url":   f"https://devfolio.co/hackathons/{h.get('slug','')}",
                "external":     True,
                "lat":          20.5937,
                "lng":          78.9629,
            })
        return events
    except Exception as e:
        print(f"Devfolio fetch failed: {e}")
        return []

def _fetch_unstop():
    """Fetch competitions from Unstop public API."""
    try:
        res = requests.get(
            "https://unstop.com/api/public/opportunity/search-result"
            "?opportunity=hackathon&page=1&size=8&status=open",
            headers={
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0",
            },
            timeout=8
        )
        res.raise_for_status()
        data = res.json()
        events = []
        items = data.get("data", {}).get("data", [])
        for item in items[:8]:
            opp = item.get("opportunity", item)
            events.append({
                "id":           f"unstop_{opp.get('id','')}",
                "title":        opp.get("title", ""),
                "description":  opp.get("tagline") or opp.get("description", "")[:200],
                "category":     "career",
                "venue":        opp.get("city") or "Online",
                "datetime":     (opp.get("start_date") or "")[:16].replace("T", " "),
                "rsvp_count":   opp.get("total_registrations", 0),
                "image_url":    opp.get("image") or "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400",
                "why_it_matters": "Competition — great for resume + MAR points",
                "source":       "unstop",
                "source_url":   f"https://unstop.com/hackathons/{opp.get('id','')}",
                "external":     True,
                "lat":          20.5937,
                "lng":          78.9629,
            })
        return events
    except Exception as e:
        print(f"Unstop fetch failed: {e}")
        return []

def _fetch_gdg():
    """Fetch GDG events — uses public community data."""
    try:
        res = requests.get(
            "https://gdg.community.dev/api/event/?status=Live"
            "&types=Study+Jam,DevFest,Info+Session"
            "&country=India&page=1&page_size=8",
            headers={"Accept": "application/json"},
            timeout=8
        )
        res.raise_for_status()
        data = res.json()
        events = []
        for ev in data.get("results", [])[:8]:
            events.append({
                "id":           f"gdg_{ev.get('id','')}",
                "title":        ev.get("title", ""),
                "description":  ev.get("description", "")[:200],
                "category":     "tech",
                "venue":        ev.get("chapter", {}).get("city", "India"),
                "datetime":     (ev.get("start_date") or "")[:16].replace("T", " "),
                "rsvp_count":   ev.get("attendees_count", 0),
                "image_url":    ev.get("cropped_banner_url") or "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400",
                "why_it_matters": "GDG event — Google community + MAR points",
                "source":       "gdg",
                "source_url":   ev.get("url", "https://gdg.community.dev"),
                "external":     True,
                "lat":          20.5937,
                "lng":          78.9629,
            })
        return events
    except Exception as e:
        print(f"GDG fetch failed: {e}")
        return []

def _get_hack2skill_backup():
    """Static curated list — Hack2Skill doesn't have a public API."""
    return [
        {
            "id": "h2s_1",
            "title": "Smart India Hackathon 2025",
            "description": "India's biggest hackathon. Build solutions for real government problem statements. Open to all college students.",
            "category": "tech",
            "venue": "Pan India",
            "datetime": "2025-12-15 09:00",
            "rsvp_count": 50000,
            "image_url": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400",
            "why_it_matters": "National recognition + MAR points",
            "source": "hack2skill",
            "source_url": "https://www.sih.gov.in",
            "external": True,
            "lat": 20.5937,
            "lng": 78.9629,
        },
        {
            "id": "h2s_2",
            "title": "HackWithInfy 2025",
            "description": "Infosys hackathon for engineering students. Build innovative products. Winners get PPOs.",
            "category": "tech",
            "venue": "Online",
            "datetime": "2025-12-20 09:00",
            "rsvp_count": 12000,
            "image_url": "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400",
            "why_it_matters": "PPO opportunity + MAR points",
            "source": "hack2skill",
            "source_url": "https://hack2skill.com",
            "external": True,
            "lat": 20.5937,
            "lng": 78.9629,
        },
        {
            "id": "h2s_3",
            "title": "Google Solution Challenge 2025",
            "description": "Build apps using Google tech to solve UN Sustainable Development Goals. Open globally.",
            "category": "tech",
            "venue": "Online",
            "datetime": "2025-11-30 09:00",
            "rsvp_count": 8000,
            "image_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400",
            "why_it_matters": "Global recognition + Google mentorship",
            "source": "gdg",
            "source_url": "https://developers.google.com/community/gdsc-solution-challenge",
            "external": True,
            "lat": 20.5937,
            "lng": 78.9629,
        },
        {
            "id": "h2s_4",
            "title": "MLH Global Hackathon 2025",
            "description": "Major League Hacking's flagship hackathon series. Projects judged by top tech companies.",
            "category": "tech",
            "venue": "Online + In-person",
            "datetime": "2025-12-05 09:00",
            "rsvp_count": 15000,
            "image_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400",
            "why_it_matters": "International exposure + prizes",
            "source": "hack2skill",
            "source_url": "https://mlh.io",
            "external": True,
            "lat": 20.5937,
            "lng": 78.9629,
        },
        {
            "id": "h2s_5",
            "title": "Flipkart GRiD 6.0",
            "description": "Flipkart's engineering challenge. Solve real e-commerce problems. Top performers get internships.",
            "category": "career",
            "venue": "Online",
            "datetime": "2025-12-10 09:00",
            "rsvp_count": 25000,
            "image_url": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400",
            "why_it_matters": "Flipkart internship pipeline",
            "source": "unstop",
            "source_url": "https://unstop.com",
            "external": True,
            "lat": 20.5937,
            "lng": 78.9629,
        },
    ]

# ── Cache layer ────────────────────────────────────────────────────────

def get_external_events(force_refresh=False):
    """
    Returns external events.
    Uses MongoDB cache — refreshes every 30 min.
    Falls back to stored backup if all APIs fail.
    """
    db  = get_db()
    now = datetime.now()

    # Check cache
    if not force_refresh:
        cache = db.external_cache.find_one({"key": "external_events"})
        if cache:
            cached_at = datetime.fromisoformat(cache["cached_at"])
            if (now - cached_at).seconds < CACHE_DURATION_MINUTES * 60:
                return cache["events"]

    # Fetch fresh
    print("🔄 Fetching external events...")
    live_events = []
    live_events += _fetch_devfolio()
    live_events += _fetch_unstop()
    live_events += _fetch_gdg()

    # Always include Hack2Skill backup (no public API)
    backup = _get_hack2skill_backup()

    # Merge: deduplicate by id
    seen_ids = set()
    merged   = []
    for e in live_events + backup:
        if e["id"] not in seen_ids:
            seen_ids.add(e["id"])
            merged.append(e)

    # If all APIs failed, use full backup from DB
    if not live_events:
        print("⚠️ All APIs failed — using stored backup")
        stored = db.external_cache.find_one({"key": "external_backup"})
        if stored:
            return stored["events"]
        # First time — use static backup only
        return backup

    # Save to cache + backup
    db.external_cache.replace_one(
        {"key": "external_events"},
        {"key": "external_events", "events": merged, "cached_at": now.isoformat()},
        upsert=True
    )
    # Also save as backup (longer-lived)
    db.external_cache.replace_one(
        {"key": "external_backup"},
        {"key": "external_backup", "events": merged, "cached_at": now.isoformat()},
        upsert=True
    )

    print(f"✅ Fetched {len(live_events)} live + {len(backup)} backup external events")
    return merged
