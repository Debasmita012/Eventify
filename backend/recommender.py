import re
from collections import defaultdict

def _tokenise(text):
    if not text:
        return set()
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return set(text.split())

def index_all_events(events):
    # No indexing needed — we compute on the fly
    print(f"✅ {len(events)} events ready (keyword recommender)")

def get_recommendations(interests, n=8):
    # Called with interests list but we need events too
    # Returns empty — main.py will call _recommend_from_events directly
    return []

def _score_event(event, query_tokens):
    """Score an event against query tokens."""
    event_text = f"{event.get('title','')} {event.get('description','')} {event.get('category','')} {event.get('why_it_matters','')}"
    event_tokens = _tokenise(event_text)
    return len(query_tokens & event_tokens)

def recommend_events(events, interests, n=8):
    """Return top-n events matching interests. Used directly in main.py."""
    if not events:
        return []
    query_tokens = _tokenise(" ".join(interests))
    scored = []
    for e in events:
        score = _score_event(e, query_tokens)
        # Boost by rsvp_count so popular events rank higher
        score = score * 10 + (e.get('rsvp_count', 0) / 100)
        scored.append((score, e))
    scored.sort(key=lambda x: x[0], reverse=True)
    result = [e for _, e in scored[:n]]
    # If not enough matches, pad with popular events
    if len(result) < n:
        seen_ids = {e['id'] for e in result}
        for e in sorted(events, key=lambda x: x.get('rsvp_count', 0), reverse=True):
            if e['id'] not in seen_ids:
                result.append(e)
                seen_ids.add(e['id'])
            if len(result) >= n:
                break
    return result

def search_events(events, query, n=8):
    """Keyword search over events."""
    if not events or not query:
        return events[:n]
    query_tokens = _tokenise(query)
    scored = []
    for e in events:
        score = _score_event(e, query_tokens)
        if score > 0:
            scored.append((score, e))
    scored.sort(key=lambda x: x[0], reverse=True)
    result = [e for _, e in scored[:n]]
    if not result:
        # Return popular events as fallback
        result = sorted(events, key=lambda x: x.get('rsvp_count', 0), reverse=True)[:n]
    return result

def get_surprise(events, interests):
    """Return one event least matching interests."""
    if not events:
        return None
    query_tokens = _tokenise(" ".join(interests))
    scored = []
    for e in events:
        score = _score_event(e, query_tokens)
        scored.append((score, e))
    # Sort ascending — least matching = most surprising
    scored.sort(key=lambda x: x[0])
    return scored[0][1] if scored else events[0]
