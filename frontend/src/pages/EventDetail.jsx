import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import API from '../config'

const CAT_COLORS = {
  tech: 'bg-blue-100 text-blue-700', cultural: 'bg-purple-100 text-purple-700',
  sports: 'bg-green-100 text-green-700', music: 'bg-pink-100 text-pink-700',
  career: 'bg-yellow-100 text-yellow-700', wellness: 'bg-teal-100 text-teal-700',
  gaming: 'bg-red-100 text-red-700',
}

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [rsvpd, setRsvpd] = useState(false)
  const [bookmarked, setBook] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const userId = localStorage.getItem('user_id')

  useEffect(() => {
    const load = async () => {
      try {
        const [evRes, rsvpRes, bookRes] = await Promise.all([
          axios.get(`${API}/events/${id}`),
          axios.get(`${API}/rsvps/${userId}`),
          axios.get(`${API}/bookmarks/${userId}`),
        ])
        setEvent(evRes.data)
        setCount(evRes.data.rsvp_count)
        setRsvpd(rsvpRes.data.some(e => e.id === parseInt(id)))
        setBook(bookRes.data.some(e => e.id === parseInt(id)))
      } catch { navigate('/feed') }
    }
    load()
  }, [id, navigate, userId])

  const handleRSVP = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API}/rsvp`, {
        user_id: userId, event_id: parseInt(id)
      })
      const added = res.data.action === 'added'
      setRsvpd(added)
      setCount(c => added ? c + 1 : c - 1)
      if (res.data.conflict) {
        alert(`⚠️ Schedule clash!\nThis overlaps with "${res.data.conflict}"`)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleBookmark = async () => {
    try {
      const res = await axios.post(`${API}/bookmark`, {
        user_id: userId, event_id: parseInt(id)
      })
      setBook(res.data.action === 'added')
    } catch (e) { console.error(e) }
  }

  if (!event) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      Loading event...
    </div>
  )

  const date = new Date(event.datetime)
  const avatars = [1, 2, 3, 4, 5].map(i =>
    `https://i.pravatar.cc/36?u=${event.id * 10 + i}`)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-gray-400 hover:text-gray-700
          text-sm mb-4 transition">
        ← Back
      </button>

      {/* Hero image */}
      {event.image_url && (
        <div className="h-56 rounded-2xl overflow-hidden mb-6">
          <img src={event.image_url} alt={event.title}
            className="w-full h-full object-cover" />
        </div>
      )}

      {/* Title block */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full
              ${CAT_COLORS[event.category] || 'bg-gray-100 text-gray-600'}`}>
              {event.category}
            </span>
            {event.rsvp_count > 100 && (
              <span className="text-xs bg-orange-100 text-orange-700
                px-2.5 py-1 rounded-full font-medium">
                🔥 Trending
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
        </div>
        <button onClick={handleBookmark}
          className="text-2xl hover:scale-110 transition-transform mt-1">
          {bookmarked ? '🔖' : '🤍'}
        </button>
      </div>

      {/* Why it matters */}
      {event.why_it_matters && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl
          px-4 py-3 mb-5 flex items-start gap-2">
          <span className="text-lg">✨</span>
          <div>
            <div className="text-xs font-semibold text-indigo-600 mb-0.5">
              Why this matters
            </div>
            <div className="text-sm text-indigo-800">{event.why_it_matters}</div>
          </div>
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          {
            icon: '📅', label: 'Date', value: date.toLocaleDateString('en-IN',
              { weekday: 'long', day: 'numeric', month: 'long' })
          },
          {
            icon: '🕐', label: 'Time', value: date.toLocaleTimeString('en-IN',
              { hour: '2-digit', minute: '2-digit' })
          },
          { icon: '📍', label: 'Venue', value: event.venue },
          { icon: '🎫', label: 'RSVPs', value: `${count} students going` },
        ].map(item => (
          <div key={item.label}
            className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-400 mb-0.5">{item.icon} {item.label}</div>
            <div className="text-sm font-medium text-gray-800">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="mb-6">
        <h2 className="font-semibold text-gray-900 mb-2">About this event</h2>
        <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
      </div>

      {/* Social proof */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex -space-x-2">
          {avatars.map((url, i) => (
            <img key={i} src={url}
              className="w-8 h-8 rounded-full border-2 border-white" />
          ))}
        </div>
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{count} students</span> are going
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={handleRSVP} disabled={loading}
          className={`flex-1 py-3.5 rounded-2xl font-semibold text-sm transition-all
            ${rsvpd
              ? 'bg-green-500 text-white'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          {loading ? '...' : rsvpd ? '✓ You\'re Going!' : 'RSVP to this Event'}
        </button>
        <button
          onClick={() => window.open(`${API}/export/${event.id}.ics`, '_blank')}
          className="px-5 py-3.5 rounded-2xl border border-gray-200
            text-gray-600 text-sm hover:bg-gray-50 transition font-medium">
          📅 Save
        </button>
      </div>

    </div>
  )
}
