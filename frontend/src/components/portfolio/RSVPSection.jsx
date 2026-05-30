import React from 'react'
import { CalendarClock, MapPin, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import API from '../../config'

export default function RSVPSection({ events, userId, onCancel }) {
  if (events.length === 0) return null

  const handleCancel = async (eventId) => {
    if(!window.confirm("Are you sure you want to cancel your RSVP?")) return
    try {
      await axios.post(`${API}/rsvp`, { user_id: userId, event_id: eventId })
      if(onCancel) onCancel()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-bold text-gray-900">Upcoming RSVP Events</h2>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition bg-white shadow-sm">
            <div className="flex flex-col items-center justify-center bg-indigo-50 text-indigo-700 rounded-lg w-16 h-16 flex-shrink-0 border border-indigo-100">
              <span className="text-xs font-bold uppercase">{new Date(event.datetime).toLocaleString('default', { month: 'short' })}</span>
              <span className="text-xl font-black">{new Date(event.datetime).getDate()}</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="font-bold text-gray-900 text-base">{event.title}</h3>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.venue}</span>
                <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs uppercase">Booked</span>
              </div>
            </div>
            
            <div className="flex sm:flex-col gap-2 items-center sm:items-end justify-center">
              <Link to={`/event/${event.id}`} className="px-3 py-1.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
                View Event
              </Link>
              <button onClick={() => handleCancel(event.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Cancel RSVP">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
