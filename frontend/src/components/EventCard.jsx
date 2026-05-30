import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API from '../config'
import QRCode from 'react-qr-code'

const CAT_COLORS = {
  tech: 'bg-blue-100 text-blue-700',
  cultural: 'bg-purple-100 text-purple-700',
  sports: 'bg-green-100 text-green-700',
  music: 'bg-pink-100 text-pink-700',
  career: 'bg-yellow-100 text-yellow-700',
  wellness: 'bg-teal-100 text-teal-700',
  gaming: 'bg-red-100 text-red-700',
}

export default function EventCard({ event, isRsvpd = false, isBookmarked = false, onUpdate, isActive = false }) {
  const [rsvpd, setRsvpd] = useState(isRsvpd)
  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const [count, setCount] = useState(event.rsvp_count)
  const [loadRsvp, setLoadRsvp] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const navigate = useNavigate()
  const userId = localStorage.getItem('user_id')
  const trending = count > 100

  const handleRSVP = async (e) => {
    e.stopPropagation()
    setLoadRsvp(true)
    try {
      const res = await axios.post(`${API}/rsvp`, {
        user_id: userId, event_id: event.id
      })
      const added = res.data.action === 'added'
      setRsvpd(added)
      setCount(c => added ? c + 1 : c - 1)
      if (res.data.conflict) {
        alert(`⚠️ Schedule clash!\nThis event overlaps with "${res.data.conflict}" you're already attending.`)
      }
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error(error);
      alert('RSVP failed — is the backend running?')
    }
    setLoadRsvp(false)
  }

  const handleBookmark = async (e) => {
    e.stopPropagation()
    try {
      const res = await axios.post(`${API}/bookmark`, {
        user_id: userId, event_id: event.id
      })
      setBookmarked(res.data.action === 'added')
    } catch (e) { console.error(e) }
  }

  const handleExport = (e) => {
    e.stopPropagation()
    window.open(`${API}/export/${event.id}.ics`, '_blank')
  }

  const date = new Date(event.datetime)
  const avatars = [1, 2, 3, 4].map(i =>
    `https://i.pravatar.cc/28?u=${event.id * 10 + i}`)

  return (
    <div
      onClick={() => navigate(`/event/${event.id}`)}
      className={`bg-white rounded-2xl border ${isActive ? 'border-indigo-500 shadow-indigo-100' : 'border-gray-100'} overflow-hidden
        cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group`}
      style={isActive ? { boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.4)' } : {}}
    >

      {/* Image */}
      {event.image_url && (
        <div className="h-36 overflow-hidden relative">
          <img src={event.image_url} alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          {trending && (
            <span className="absolute top-2 left-2 bg-orange-500 text-white
              text-xs font-semibold px-2 py-0.5 rounded-full">
              🔥 Trending
            </span>
          )}
          <button onClick={handleBookmark}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80
              flex items-center justify-center text-sm hover:bg-white transition">
            {bookmarked ? '🔖' : '🤍'}
          </button>
        </div>
      )}

      <div className="p-4">
        {/* Category + venue */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full
            ${CAT_COLORS[event.category] || 'bg-gray-100 text-gray-600'}`}>
            {event.category}
          </span>
          <span className="text-xs text-gray-400 truncate">{event.venue}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-sm">
          {event.title}
        </h3>

        {/* Why it matters */}
        {event.why_it_matters && (
          <p className="text-xs text-indigo-600 font-medium mb-2">
            ✨ {event.why_it_matters}
          </p>
        )}

        {/* Date */}
        <p className="text-xs text-gray-400 mb-3">
          📅 {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          &nbsp;🕐 {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>

        {/* Social proof */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex -space-x-1">
            {avatars.map((url, i) => (
              <img key={i} src={url}
                className="w-5 h-5 rounded-full border border-white" />
            ))}
          </div>
          <span className="text-xs text-gray-500">{count} going</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {rsvpd ? (
            <>
              <button onClick={handleRSVP} disabled={loadRsvp}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all bg-green-500 text-white">
                {loadRsvp ? '...' : '✓ Booked'}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowQR(true); }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all bg-purple-600 text-white hover:bg-purple-700">
                🎫 QR Code
              </button>
            </>
          ) : (
            <button onClick={handleRSVP} disabled={loadRsvp}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all bg-indigo-600 text-white hover:bg-indigo-700">
              {loadRsvp ? '...' : 'RSVP'}
            </button>
          )}
          <button onClick={handleExport}
            className="px-3 py-2 rounded-xl border border-gray-200
              text-gray-500 text-xs hover:bg-gray-50 transition">
            📅
          </button>
        </div>
      </div>

      {/* QR Modal Overlay */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { e.stopPropagation(); setShowQR(false); }}>
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Event Ticket</h3>
            <p className="text-gray-500 text-sm mb-6">Scan this code for entry to {event.title}</p>
            <div className="bg-white p-4 inline-block rounded-xl shadow-inner border border-gray-100 mb-6">
              <QRCode value={`eventify:user_${userId}:event_${event.id}`} size={200} />
            </div>
            <button onClick={() => setShowQR(false)} className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition">
              Close Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
