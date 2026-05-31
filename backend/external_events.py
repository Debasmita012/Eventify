import requests
import os
from datetime import datetime
from database import get_db

CACHE_MINUTES = 30  # refresh every 30 min — safe for Render free tier

# ════════════════════════════════════════════════════════════════════
# LAYER 1 — GDG (free public API, always works)
# ════════════════════════════════════════════════════════════════════

def _fetch_gdg():
    """
    GDG has a real public API — no auth, no key needed.
    Fetches live events from India.
    """
    try:
        res = requests.get(
            "https://gdg.community.dev/api/event/"
            "?status=Live&country=India&page=1&page_size=12",
            headers={"Accept": "application/json"},
            timeout=10,
        )
        res.raise_for_status()
        data   = res.json()
        events = []
        for ev in data.get("results", []):
            # Skip events with no title
            if not ev.get("title"):
                continue
            start = ev.get("start_date", "")
            events.append({
                "id":             f"gdg_{ev.get('id','')}",
                "title":          ev.get("title", ""),
                "description":    (ev.get("description") or "")[:250],
                "category":       "tech",
                "venue":          ev.get("chapter", {}).get("city", "India"),
                "datetime":       start[:16].replace("T", " ") if start else "",
                "rsvp_count":     ev.get("attendees_count", 0),
                "image_url":      ev.get("cropped_banner_url")
                                  or "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400",
                "why_it_matters": "GDG event — Google community, free to attend",
                "source":         "gdg",
                "source_label":   "GDG",
                "source_url":     ev.get("url", "https://gdg.community.dev"),
                "external":       True,
                "is_live_data":   True,
            })
        print(f"✅ GDG: fetched {len(events)} events")
        return events
    except Exception as e:
        print(f"❌ GDG fetch failed: {e}")
        return []


# ════════════════════════════════════════════════════════════════════
# LAYER 2 — Devfolio (undocumented internal API — works most of the time)
# ════════════════════════════════════════════════════════════════════

def _fetch_devfolio():
    """
    Devfolio's internal API — discovered via browser DevTools.
    Not officially documented. Works as of 2025.
    Falls back gracefully if blocked.
    """
    try:
        # Try their search API first
        res = requests.post(
            "https://api.devfolio.co/api/search/hackathons",
            json={
                "page":     0,
                "per_page": 10,
                "seed":     0,
            },
            headers={
                "Content-Type": "application/json",
                "Origin":       "https://devfolio.co",
                "Referer":      "https://devfolio.co/",
                "User-Agent":   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            timeout=10,
        )

        if res.status_code != 200:
            return []

        data   = res.json()
        items  = data.get("hackathons", data.get("results", []))
        events = []

        for h in items[:10]:
            starts = h.get("starts_at", h.get("start_date", ""))
            events.append({
                "id":             f"devfolio_{h.get('slug', h.get('id',''))}",
                "title":          h.get("name", h.get("title", "")),
                "description":    (h.get("tagline") or h.get("description") or "")[:250],
                "category":       "tech",
                "venue":          "Online" if h.get("is_online") else h.get("city", "India"),
                "datetime":       starts[:16].replace("T", " ") if starts else "",
                "rsvp_count":     h.get("total_applications", h.get("registrations", 0)),
                "image_url":      h.get("cover_image_url")
                                  or "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400",
                "why_it_matters": "Hackathon — build, win prizes, boost resume",
                "source":         "devfolio",
                "source_label":   "Devfolio",
                "source_url":     f"https://devfolio.co/hackathons/{h.get('slug','')}",
                "external":       True,
                "is_live_data":   True,
            })

        print(f"✅ Devfolio: fetched {len(events)} events")
        return events

    except Exception as e:
        print(f"❌ Devfolio fetch failed: {e}")
        return []


# ════════════════════════════════════════════════════════════════════
# LAYER 3 — Static curated backup (always available, never fails)
# These are real recurring events — update dates before hackathon demo
# ════════════════════════════════════════════════════════════════════

STATIC_EVENTS = [
    # Unstop
    {
        "id":             "unstop_sih2025",
        "title":          "Smart India Hackathon 2025",
        "description":    "India's biggest hackathon organized by AICTE. Solve real government problem statements. Open to all college students across India.",
        "category":       "tech",
        "venue":          "Pan India — Multiple Venues",
        "datetime":       "2025-12-15 09:00",
        "rsvp_count":     95000,
        "image_url":      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400",
        "why_it_matters": "National recognition — certificate + MAR points",
        "source":         "unstop",
        "source_label":   "Unstop",
        "source_url":     "https://unstop.com/hackathons/smart-india-hackathon",
        "external":       True,
        "is_live_data":   False,
    },
    {
        "id":             "unstop_flipkart",
        "title":          "Flipkart GRiD 6.0",
        "description":    "Flipkart's engineering challenge for students. Solve real e-commerce and supply chain problems. Top performers get PPO offers.",
        "category":       "career",
        "venue":          "Online",
        "datetime":       "2025-12-10 09:00",
        "rsvp_count":     28000,
        "image_url":      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400",
        "why_it_matters": "PPO pipeline from Flipkart — placement prep",
        "source":         "unstop",
        "source_label":   "Unstop",
        "source_url":     "https://unstop.com/competitions/flipkart-grid",
        "external":       True,
        "is_live_data":   False,
    },
    {
        "id":             "unstop_amazon",
        "title":          "Amazon ML Challenge 2025",
        "description":    "Amazon's machine learning competition for students. Real datasets, real problems. Top 3 teams get Amazon internship interviews.",
        "category":       "tech",
        "venue":          "Online",
        "datetime":       "2025-12-20 09:00",
        "rsvp_count":     15000,
        "image_url":      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400",
        "why_it_matters": "Amazon internship track — AI/ML skills",
        "source":         "unstop",
        "source_label":   "Unstop",
        "source_url":     "https://unstop.com/competitions/amazon-ml-challenge",
        "external":       True,
        "is_live_data":   False,
    },
    # Hack2Skill
    {
        "id":             "h2s_mlh",
        "title":          "MLH Global Hackathon Series",
        "description":    "Major League Hacking's flagship series. Projects judged by top tech companies. Open globally to all students.",
        "category":       "tech",
        "venue":          "Online + In-Person",
        "datetime":       "2025-12-05 09:00",
        "rsvp_count":     20000,
        "image_url":      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400",
        "why_it_matters": "International exposure + MLH certificate",
        "source":         "hack2skill",
        "source_label":   "Hack2Skill",
        "source_url":     "https://mlh.io/seasons/2025/events",
        "external":       True,
        "is_live_data":   False,
    },
    {
        "id":             "h2s_infosys",
        "title":          "HackWithInfy 2025",
        "description":    "Infosys hackathon for engineering students. Build innovative products and solutions. Winners receive PPO offers from Infosys.",
        "category":       "career",
        "venue":          "Online",
        "datetime":       "2025-12-18 09:00",
        "rsvp_count":     18000,
        "image_url":      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400",
        "why_it_matters": "Infosys PPO opportunity — placement track",
        "source":         "hack2skill",
        "source_label":   "Hack2Skill",
        "source_url":     "https://hack2skill.com/hack/HackWithInfy",
        "external":       True,
        "is_live_data":   False,
    },
    {
        "id":             "h2s_google_solution",
        "title":          "Google Solution Challenge 2026",
        "description":    "Build apps using Google technologies to address UN Sustainable Development Goals. Global competition with Google mentors.",
        "category":       "tech",
        "venue":          "Online — Global",
        "datetime":       "2026-01-15 09:00",
        "rsvp_count":     10000,
        "image_url":      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400",
        "why_it_matters": "Global recognition + Google mentorship",
        "source":         "gdg",
        "source_label":   "GDG",
        "source_url":     "https://developers.google.com/community/gdsc-solution-challenge",
        "external":       True,
        "is_live_data":   False,
    },
    # Luma (curated tech community events — update with real Luma event URLs)
    {
        "id":             "luma_devfest_kolkata",
        "title":          "DevFest Kolkata 2025",
        "description":    "GDG Kolkata's annual developer festival. Android, Cloud, Flutter, AI sessions. Free entry, open to all developers.",
        "category":       "tech",
        "venue":          "Kolkata",
        "datetime":       "2025-11-30 09:00",
        "rsvp_count":     500,
        "image_url":      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
        "why_it_matters": "Google-backed event — free certificate",
        "source":         "luma",
        "source_label":   "Luma",
        "source_url":     "https://lu.ma/devfest-kolkata",
        "external":       True,
        "is_live_data":   False,
    },
    {
        "id":             "luma_buildwithAI",
        "title":          "Build with AI — Gemini Hackathon",
        "description":    "Google-backed AI hackathon. Build with Gemini API, Vertex AI, and Google Cloud. Open to all students and developers.",
        "category":       "tech",
        "venue":          "Online",
        "datetime":       "2025-12-08 10:00",
        "rsvp_count":     3000,
        "image_url":      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400",
        "why_it_matters": "Build AI projects + Google Cloud credits",
        "source":         "luma",
        "source_label":   "Luma",
        "source_url":     "https://lu.ma/buildwithai",
        "external":       True,
        "is_live_data":   False,
    },
    {
        "id":             "devfolio_ethglobal_india",
        "title":          "ETHGlobal India 2025",
        "description":    "The biggest Ethereum hackathon in India. Build decentralized apps, learn Web3, and win huge bounties from top protocols.",
        "category":       "tech",
        "venue":          "Bengaluru",
        "datetime":       "2025-12-01 10:00",
        "rsvp_count":     5500,
        "image_url":      "https://images.unsplash.com/photo-1622630998477-20b41cd0e025?w=400",
        "why_it_matters": "$100k+ in bounties — Elite Web3 networking",
        "source":         "devfolio",
        "source_label":   "Devfolio",
        "source_url":     "https://ethglobal.com",
        "external":       True,
        "is_live_data":   False,
    },
    {
        "id":             "devfolio_polygon_buidl",
        "title":          "Polygon BUIDL IT 2025",
        "description":    "Polygon's flagship global hackathon. Create scalable dApps and bring the next million users to Web3.",
        "category":       "tech",
        "venue":          "Online",
        "datetime":       "2025-11-20 09:00",
        "rsvp_count":     8200,
        "image_url":      "https://images.unsplash.com/photo-1644158403333-77d0fbd84148?w=400",
        "why_it_matters": "Massive grants + direct Polygon VC feedback",
        "source":         "devfolio",
        "source_label":   "Devfolio",
        "source_url":     "https://polygon.technology/buidl-it",
        "external":       True,
        "is_live_data":   False,
    },
    {
        "id":             "luma_react_india",
        "title":          "React India 2025",
        "description":    "International conference for the React community. Join developers from around the world to discuss the latest in React and React Native.",
        "category":       "tech",
        "venue":          "Goa",
        "datetime":       "2025-10-18 09:00",
        "rsvp_count":     2500,
        "image_url":      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
        "why_it_matters": "Top tier networking + advanced React workshops",
        "source":         "luma",
        "source_label":   "Luma",
        "source_url":     "https://reactindia.io",
        "external":       True,
        "is_live_data":   False,
    },
    {
        "id":             "unstop_tata_crucible",
        "title":          "Tata Crucible Campus Hackathon",
        "description":    "Tata Group's premier innovation challenge. Solve pressing business cases with technology. Open to all disciplines.",
        "category":       "career",
        "venue":          "Online",
        "datetime":       "2025-09-05 10:00",
        "rsvp_count":     35000,
        "image_url":      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400",
        "why_it_matters": "Pre-placement interviews with Tata companies",
        "source":         "unstop",
        "source_label":   "Unstop",
        "source_url":     "https://unstop.com",
        "external":       True,
        "is_live_data":   False,
    },
    {
        "id":             "gdg_cloud_summit",
        "title":          "Google Cloud Summit India",
        "description":    "The ultimate Google Cloud event. Hands-on labs, AI innovations, and certification prep sessions with Google engineers.",
        "category":       "tech",
        "venue":          "Mumbai",
        "datetime":       "2025-08-22 09:00",
        "rsvp_count":     4000,
        "image_url":      "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400",
        "why_it_matters": "Google Cloud credits + free certification vouchers",
        "source":         "gdg",
        "source_label":   "GDG",
        "source_url":     "https://cloud.google.com/events",
        "external":       True,
        "is_live_data":   False,
    },
    {
        "id":             "h2s_microsoft_imagine",
        "title":          "Microsoft Imagine Cup 2026",
        "description":    "The premier global student technology competition. Build with Microsoft AI and Azure to solve global challenges.",
        "category":       "tech",
        "venue":          "Online — Global",
        "datetime":       "2026-02-10 09:00",
        "rsvp_count":     50000,
        "image_url":      "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=400",
        "why_it_matters": "$100,000 top prize + mentorship from Satya Nadella",
        "source":         "hack2skill",
        "source_label":   "Hack2Skill",
        "source_url":     "https://imaginecup.microsoft.com",
        "external":       True,
        "is_live_data":   False,
    }
]


# ════════════════════════════════════════════════════════════════════
# MAIN FUNCTION — called by main.py
# ════════════════════════════════════════════════════════════════════

def get_external_events(force_refresh=False):
    """
    Returns merged external events with 30-min MongoDB cache.
    Strategy: GDG live + Devfolio live + static backup always.
    Never fails — static backup ensures page is never empty.
    """
    db  = get_db()
    now = datetime.now()

    # Check cache
    if not force_refresh:
        try:
            cache = db.external_cache.find_one({"key": "external_events"})
            if cache:
                cached_at = datetime.fromisoformat(cache["cached_at"])
                age_mins  = (now - cached_at).seconds / 60
                if age_mins < CACHE_MINUTES:
                    print(f"📦 Cache hit — {len(cache['events'])} external events")
                    return cache["events"]
        except Exception as e:
            print(f"Cache read failed: {e}")

    # Fetch live sources
    live_events = []
    live_events += _fetch_gdg()
    live_events += _fetch_devfolio()

    # Always append static events (deduplicate by id)
    seen_ids = {e["id"] for e in live_events}
    final    = list(live_events)
    for e in STATIC_EVENTS:
        if e["id"] not in seen_ids:
            final.append(e)
            seen_ids.add(e["id"])

    # Sort: live data first, then by rsvp_count
    final.sort(key=lambda x: (not x.get("is_live_data", False),
                               -x.get("rsvp_count", 0)))

    # Save to cache
    try:
        db.external_cache.replace_one(
            {"key": "external_events"},
            {
                "key":       "external_events",
                "events":    final,
                "cached_at": now.isoformat(),
                "live_count": len(live_events),
            },
            upsert=True,
        )
    except Exception as e:
        print(f"Cache write failed: {e}")

    print(f"✅ External events: {len(live_events)} live + {len(STATIC_EVENTS)} backup = {len(final)} total")
    return final
