import React from 'react'
import { History, MapPin, Calendar, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AttendedEvents({ events }) {
  if (events.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-500" />
          Previously Attended Events
        </h2>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition bg-gray-50/50">
            <div className="w-full sm:w-32 h-24 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
              <img src={event.image_url || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400`} alt={event.title} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 text-lg">{event.title}</h3>
                  <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 font-semibold rounded-full uppercase tracking-wide">
                    Completed
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(event.datetime).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.venue}</span>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md text-xs font-medium uppercase tracking-wide">{event.category}</span>
                </div>
              </div>
              
              <div className="mt-3 flex gap-2">
                <Link to={`/event/${event.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  View Details <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
