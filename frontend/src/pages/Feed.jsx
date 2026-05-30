import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import EventCard from '../components/EventCard'
import ChatBot from '../components/ChatBot'
import GestureController from '../components/GestureController'
import API from '../config'

const MOODS = [
  { label: '🧠 Learn', tags: ['tech', 'career'] },
  { label: '😎 Chill', tags: ['music', 'wellness', 'cultural'] },
  { label: '🏆 Compete', tags: ['sports', 'gaming'] },
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

  const navigate = useNavigate()
  const userId = localStorage.getItem('user_id')
  const name = localStorage.getItem('user_name') || 'there'

  // ── Fetch personalised feed ──────────────────────────────────────────
  const fetchFeed = useCallback(async () => {
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
      setActiveCard(0)
    } catch (e) {
      console.error('Feed error:', e)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFeed()
  }, [fetchFeed])

  // ── Search ───────────────────────────────────────────────────────────
  const handleSearch = async (q) => {
    if (!q.trim()) return fetchFeed()
    setLoading(true)
    try {
      const res = await axios.get(
        `${API}/search?q=${encodeURIComponent(q)}`
      )
      setEvents(res.data)
      setActiveMood(null)
      setActiveCard(0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  // ── Mood filter ──────────────────────────────────────────────────────
  const handleMood = async (mood) => {
    setActiveMood(mood.label)
    setLoading(true)
    try {
      const res = await axios.get(
        `${API}/search?q=${mood.tags.join(' ')}`
      )
      setEvents(res.data)
      setActiveCard(0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  // ── Surprise me ──────────────────────────────────────────────────────
  const handleSurprise = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/surprise/${userId}`)
      setEvents([res.data])
      setActiveMood('🎲 Surprise')
      setActiveCard(0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  // ── Reset ────────────────────────────────────────────────────────────
  const resetFeed = () => {
    setSearch('')
    setActiveMood(null)
    fetchFeed()
  }

  // ── Gesture: RSVP ────────────────────────────────────────────────────
  const handleGestureRSVP = async (event) => {
    try {
      await axios.post(`${API}/rsvp`, {
        user_id: userId,
        event_id: event.id,
      })
      fetchFeed()
    } catch (e) {
      console.error('Gesture RSVP error:', e)
    }
  }

  // ── Gesture: open detail ─────────────────────────────────────────────
  const handleOpenDetail = (event) => {
    navigate(`/event/${event.id}`)
  }

  // ── Gesture: toggle chatbot ──────────────────────────────────────────
  const handleToggleChat = () => {
    setChatOpen(o => !o)
  }

  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Greeting */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">
            Hey {name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500">
            Your personalised campus feed
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-3 text-gray-400 text-sm">
            🔍
          </span>
          <input
            className="w-full pl-10 pr-4 py-3 rounded-2xl border
              border-gray-200 bg-white shadow-sm focus:outline-none
              focus:ring-2 focus:ring-indigo-400 text-sm"
            placeholder="Search events… try 'robotics' or 'music tonight'"
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              handleSearch(e.target.value)
            }}
          />
        </div>

        {/* Mood filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {MOODS.map(m => (
            <button
              key={m.label}
              onClick={() => handleMood(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium
                transition-all border
                ${activeMood === m.label
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}>
              {m.label}
            </button>
          ))}

          <button
            onClick={handleSurprise}
            className={`px-3 py-1.5 rounded-full text-xs font-medium
              border transition-all
              ${activeMood === '🎲 Surprise'
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
              }`}>
            🎲 Surprise me
          </button>

          {activeMood && (
            <button
              onClick={resetFeed}
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
              <div key={i}
                className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm">
              No events found. Try a different search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e, idx) => (
              <div
                key={e.id}
                className={`transition-all duration-300 ${idx === activeCard
                  ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-2xl'
                  : ''
                  }`}>
                <EventCard
                  event={e}
                  isRsvpd={rsvpdIds.has(e.id)}
                  isBookmarked={bookmarkIds.has(e.id)}
                  onUpdate={fetchFeed}
                />
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── Chatbot — pass open state so gesture can control it ── */}
      <ChatBot forceOpen={chatOpen} onToggle={handleToggleChat} />

      {/* ── Gesture controller — all three handlers wired in ── */}
      <GestureController
        events={events}
        activeCard={activeCard}
        setActiveCard={setActiveCard}
        onRSVP={handleGestureRSVP}
        onOpenDetail={handleOpenDetail}
        onToggleChat={handleToggleChat}
      />

    </div>
  )
}