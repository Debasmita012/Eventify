/**
 * Fixed Feed.jsx
 * Changes:
 * 1. handleGestureRSVP — correct URL + body, no alert(), inline toast
 * 2. Added [feedback] state for non-blocking toast messages
 * 3. No Python code inside JSX
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API from '../config'
import EventCard from '../components/EventCard'
import ChatBot from '../components/ChatBot'
import GestureController from '../components/GestureController'


const MOODS = [
  { label: '🧠 Big Brain', tags: ['tech', 'career'] },
  { label: '😌 Stressed', tags: ['wellness'] },
  { label: '🎸 Creative', tags: ['cultural', 'music'] },
  { label: '🏃 Energetic', tags: ['sports', 'gaming'] },
]

export default function Feed() {
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeMood, setActiveMood] = useState(null)
  const [rsvpdIds, setRsvpdIds] = useState(new Set())
  const [bookmarkIds, setBookmarkIds] = useState(new Set())
  const [activeCard, setActiveCard] = useState(0)
  const [chatOpen, setChatOpen] = useState(false)
  const [feedback, setFeedback] = useState(null)   // ← inline toast

  const navigate = useNavigate()
  const userId = localStorage.getItem('user_id')
  const name = localStorage.getItem('user_name') || 'there'

  useEffect(() => {
    if (!userId) navigate('/onboard')
  }, [userId, navigate])

  // ── Fetch feed ────────────────────────────────────────────────────
  const fetchFeed = useCallback(async (resetActive = true) => {
    setLoading(true)
    try {
      const [feedRes, rsvpRes, bookRes] = await Promise.all([
        axios.get(`${API}/feed/${userId}`),
        axios.get(`${API}/rsvps/${userId}`),
        axios.get(`${API}/bookmarks/${userId}`),
      ])
      setEvents(feedRes.data)
      setRsvpdIds(new Set(rsvpRes.data.map(e => e.id)))
      setBookmarkIds(new Set(bookRes.data.map(e => e.id)))
      if (resetActive) setActiveCard(0)
    } catch (e) {
      if (e?.response?.status === 404) {
        localStorage.clear()
        navigate('/onboard')
        return
      }
      try {
        const res = await axios.get(`${API}/events`)
        setEvents(res.data)
      } catch (_) { }
    }
    setLoading(false)
  }, [userId, navigate])

  useEffect(() => { fetchFeed() }, [fetchFeed])

  // ── Search ────────────────────────────────────────────────────────
  const handleSearch = async (q) => {
    if (!q.trim()) return fetchFeed()
    setLoading(true)
    try {
      const res = await axios.get(`${API}/search?q=${encodeURIComponent(q)}`)
      setEvents(res.data); setActiveMood(null); setActiveCard(0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  // ── Mood filter ───────────────────────────────────────────────────
  const handleMood = async (mood) => {
    setActiveMood(mood.label); setLoading(true)
    try {
      const res = await axios.get(`${API}/search?q=${mood.tags.join(' ')}`)
      setEvents(res.data); setActiveCard(0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  // ── Surprise me ───────────────────────────────────────────────────
  const handleSurprise = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/surprise/${userId}`)
      setEvents([res.data]); setActiveMood('🎲 Surprise'); setActiveCard(0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const resetFeed = () => { setSearch(''); setActiveMood(null); fetchFeed() }

  // ── Toast helper (replaces alert) ────────────────────────────────
  const showToast = (msg, ms = 2500) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), ms)
  }

  // ── Gesture RSVP — FIXED ─────────────────────────────────────────
  // Bug was: alert() + sometimes event_id mismatch between URL and body
  const handleGestureRSVP = async () => {
    const event = events[activeCard]
    if (!event) { showToast('⚠️ No card selected'); return }

    try {
      const res = await axios.post(
        `${API}/rsvp`,   // Fixed! Back to original route
        {
          user_id: userId,          // body             ✅
          event_id: event.id,        // body             ✅
        }
      )
      if (res.data?.conflict) {
        showToast(`⚠️ Conflict: "${res.data.conflict}" — RSVPed anyway!`, 3500)
      } else {
        showToast(res.data?.action === 'added' ? '✅ RSVPed!' : '🗑️ RSVP removed')
      }
      await fetchFeed(false)
    } catch (e) {
      const status = e?.response?.status
      const detail = e?.response?.data?.detail || e.message || 'Unknown error'
      console.error('RSVP failed:', status, detail)

      if (!e?.response) {
        showToast('❌ Backend not reachable — is uvicorn running on port 8000?', 4000)
      } else if (status === 422) {
        showToast('❌ Validation error (422) — check user_id in localStorage', 4000)
      } else if (status === 404) {
        showToast('❌ Event not found (404)', 3000)
      } else {
        showToast(`❌ RSVP failed: ${detail}`, 3500)
      }
    }
  }

  const handleGestureBookmark = async () => {
    const event = events[activeCard]
    if (!event) { showToast('⚠️ No card selected'); return }

    try {
      const res = await axios.post(`${API}/bookmark`, {
        user_id: userId,
        event_id: event.id,
      })
      showToast(res.data?.action === 'added' ? '⭐ Marked interested' : 'Bookmark removed')
      await fetchFeed(false)
    } catch (e) {
      const detail = e?.response?.data?.detail || e.message || 'Unknown error'
      showToast(`❌ Bookmark failed: ${detail}`, 3500)
    }
  }
  const handleToggleChat = () => setChatOpen(o => !o)

  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Greeting */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">
            Hey {name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500">Your personalised campus feed</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-3 text-gray-400 text-sm">🔍</span>
          <input
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200
              bg-white shadow-sm focus:outline-none focus:ring-2
              focus:ring-indigo-400 text-sm"
            placeholder="Search events… try 'robotics' or 'music tonight'"
            value={search}
            onChange={e => { setSearch(e.target.value); handleSearch(e.target.value) }}
          />
        </div>

        {/* Mood chips */}
        <div className="flex gap-2 flex-wrap mb-6">
          {MOODS.map(m => (
            <button key={m.label} onClick={() => handleMood(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium
                transition-all border
                ${activeMood === m.label
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
              {m.label}
            </button>
          ))}
          <button onClick={handleSurprise}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${activeMood === '🎲 Surprise'
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'}`}>
            🎲 Surprise me
          </button>
          {activeMood && (
            <button onClick={resetFeed}
              className="px-3 py-1.5 rounded-full text-xs text-gray-400
                hover:text-gray-600 border border-transparent">
              × Reset
            </button>
          )}
        </div>

        {/* Event grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm">No events found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e, idx) => (
              <div key={e.id}
                className={`transition-all duration-300 ${idx === activeCard
                  ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-2xl' : ''}`}>
                <EventCard
                  event={e}
                  isRsvpd={rsvpdIds.has(e.id)}
                  isBookmarked={bookmarkIds.has(e.id)}
                  onUpdate={fetchFeed}
                  onFeedback={showToast}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Inline toast (no more alert() popups) ── */}
      {feedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]
          bg-gray-900 text-white text-sm font-semibold px-5 py-3
          rounded-2xl shadow-2xl pointer-events-none">
          {feedback}
        </div>
      )}

      <ChatBot forceOpen={chatOpen} onToggle={handleToggleChat} />

      <GestureController
        events={events}
        activeCard={activeCard}
        setActiveCard={setActiveCard}
        onRSVP={handleGestureRSVP}
        onBookmark={handleGestureBookmark}
        onToggleChat={handleToggleChat}
      />
    </div>
  )
}