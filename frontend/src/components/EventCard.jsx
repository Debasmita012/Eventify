import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API from '../config'

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
      className={`mc-card overflow-hidden relative group cursor-pointer ${isActive ? 'border-green-400 shadow-[4px_4px_0_rgba(74,222,128,0.5)]' : ''}`}
      style={isActive ? { transform: 'scale(1.02)' } : {}}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 z-10 pointer-events-none"></div>

      {/* Image */}
      {event.image_url && (
        <div className="h-48 overflow-hidden relative border-b-4 border-slate-300">
          <img src={event.image_url} alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
          {trending && (
            <span className="absolute top-3 left-3 bg-amber-500 text-white border-2 border-b-4 border-amber-700
              text-[10px] uppercase tracking-widest font-bold px-3 py-1 z-20">
              🔥 Trending
            </span>
          )}
          <button onClick={handleBookmark}
            className="absolute top-3 right-3 w-8 h-8 bg-white border-2 border-b-4 border-slate-300
              flex items-center justify-center text-sm hover:border-slate-400 hover:text-red-500 transition-all z-20 active:translate-y-[2px] active:border-b-2">
            {bookmarked ? '🔖' : '🤍'}
          </button>
        </div>
      )}

      <div className="p-5 relative z-20">
        {/* Category + venue */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 border-2 border-b-4
            ${CAT_COLORS[event.category] || 'bg-slate-100 border-slate-300 text-slate-700'}`}>
            {event.category}
          </span>
          <span className="text-[10px] text-slate-600 font-bold truncate uppercase tracking-widest bg-slate-100 px-3 py-1 border-2 border-slate-300">{event.venue}</span>
        </div>

        {/* Title */}
        <h3 className="font-vt font-bold text-slate-800 text-2xl mb-2 line-clamp-1 group-hover:text-green-600 transition-colors">
          {event.title}
        </h3>

        {/* Why it matters */}
        {event.why_it_matters && (
          <p className="text-xs text-slate-500 font-bold mb-3 italic">
            ✧ {event.why_it_matters}
          </p>
        )}

        {/* Date */}
        <p className="text-[10px] text-slate-500 font-outfit font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="text-green-500">📅</span> {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          <span className="text-green-500 ml-2">🕐</span> {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>

        {/* Social proof */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex -space-x-2">
            {avatars.map((url, i) => (
              <img key={i} src={url}
                className="w-6 h-6 border-2 border-slate-300 rounded-none shadow-sm" />
            ))}
          </div>
          <span className="text-xs text-slate-400 font-outfit font-bold tracking-wider">{count} ATND</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {rsvpd ? (
            <button onClick={handleRSVP} disabled={loadRsvp}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all 
                bg-green-100 text-green-700 border-2 border-b-4 border-green-300 hover:border-green-400 active:translate-y-[2px] active:border-b-2">
              {loadRsvp ? '...' : '✓ Booked'}
            </button>
          ) : (
            <button onClick={handleRSVP} disabled={loadRsvp}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all mc-btn flex items-center justify-center gap-2">
              {loadRsvp ? '...' : <><img src="/theme-assets/pickaxe.png" className="w-4 h-4 mix-blend-multiply" alt="Pickaxe" /> RSVP Now</>}
            </button>
          )}
          <button onClick={handleExport}
            className="w-10 flex items-center justify-center text-sm
              bg-slate-200 border-2 border-b-4 border-slate-400 text-slate-600 hover:border-slate-500 hover:text-slate-800 active:translate-y-[2px] active:border-b-2">
            ⬇️
          </button>
        </div>
      </div>
    </div>
  )
}
