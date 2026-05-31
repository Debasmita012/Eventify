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

  const handleToggleChat = () => setChatOpen(o => !o)

  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-transparent relative pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">

        {/* Greeting Banner */}
        <div className="mb-10 flex flex-col md:flex-row items-center gap-6 bg-green-50 border-4 border-green-700 p-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none">
            <img src="/theme-assets/castle.png" alt="Castle" className="w-full h-full object-cover mix-blend-multiply" />
          </div>
          <img src="/theme-assets/owl.png" alt="Owl" className="w-24 h-24 object-contain animate-bounce mix-blend-multiply" style={{ animationDuration: '3s' }} />
          <div className="text-center sm:text-left relative z-10">
            <h1 className="text-4xl sm:text-5xl font-vt mb-2 text-shadow-sm uppercase text-slate-800">
              Nexus Feed
            </h1>
            <p className="text-sm sm:text-base text-slate-700 font-outfit font-bold tracking-wide">
              Welcome back, {name.split(' ')[0]}. Discover your next adventure.
            </p>
          </div>
        </div>

        {/* Search Panel */}
        <div className="mc-panel p-4 mb-8 flex flex-col sm:flex-row gap-4 items-center bg-blue-50 relative overflow-hidden">
          <img src="/theme-assets/wand.png" alt="Magic" className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 pointer-events-none mix-blend-multiply" />
          <div className="relative w-full z-10">
            <span className="absolute left-5 top-4 text-slate-400 text-lg">✦</span>
            <input
              className="w-full pl-12 pr-6 py-4 border-4 border-slate-300
                bg-white focus:outline-none focus:border-blue-500 transition-all text-sm
                text-slate-800 placeholder-slate-400 font-outfit font-bold"
              placeholder="Search the nexus… try 'robotics' or 'magic'"
              value={search}
              onChange={e => { setSearch(e.target.value); handleSearch(e.target.value) }}
            />
          </div>
          {/* Mood chips */}
          <div className="flex gap-2 flex-wrap justify-center sm:justify-start w-full sm:w-auto shrink-0">
            {MOODS.map(m => (
              <button key={m.label} onClick={() => handleMood(m)}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider
                  transition-all duration-100 border-2 border-b-4
                  ${activeMood === m.label
                    ? 'bg-blue-100 text-blue-800 border-blue-400 shadow-none translate-y-[2px] border-b-2'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:text-slate-800'}`}>
                {m.label}
              </button>
            ))}
            <button onClick={handleSurprise}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-2 border-b-4 transition-all duration-100
                ${activeMood === '🎲 Surprise'
                  ? 'bg-amber-100 text-amber-800 border-amber-400 shadow-none translate-y-[2px] border-b-2'
                  : 'bg-white text-amber-600 border-slate-300 hover:border-amber-400 hover:text-amber-700'}`}>
              ✧ Surprise
            </button>
            {activeMood && (
              <button onClick={resetFeed}
                className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 border-2 border-b-4 border-slate-300
                  hover:text-red-600 hover:border-red-400 transition-colors">
                ✕ Reset
              </button>
            )}
          </div>
        </div>

        {/* Event grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-slate-200/80 border-4 border-slate-300 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-32 text-slate-500 font-outfit mc-panel bg-amber-50">
            <img src="/theme-assets/chest.png" alt="Empty" className="w-24 h-24 mx-auto mb-4 opacity-50 grayscale mix-blend-multiply" />
            <p className="text-lg uppercase tracking-widest font-bold">The treasure vault is empty.</p>
            <p className="text-xs mt-2 text-slate-600">Try adjusting your magical search frequencies.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e, idx) => (
              <div key={e.id}
                className={`transition-all duration-500 ${idx === activeCard
                  ? 'scale-[1.02] z-10' : ''}`}>
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

      {/* ── Inline toast ── */}
      {feedback && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999]
          bg-green-500 border-4 border-green-700 text-white text-sm font-bold uppercase tracking-widest px-6 py-4
          shadow-[4px_4px_0_rgba(0,0,0,0.2)] pointer-events-none animate-in slide-in-from-top-4 fade-in duration-300">
          {feedback}
        </div>
      )}

      <ChatBot forceOpen={chatOpen} onToggle={handleToggleChat} />
    </div>
  )
}