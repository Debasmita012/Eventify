import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import axios from 'axios'
import API from '../config'

const CAT_COLORS = {
  tech: '#6366f1', cultural: '#a855f7', sports: '#22c55e',
  music: '#ec4899', career: '#eab308', wellness: '#14b8a6',
  gaming: '#ef4444',
}

export default function MapView() {
  const [events, setEvents] = useState([])
  const [filter, setFilter] = useState('all')
  const [rsvpd, setRsvpd] = useState(new Set())
  const [loadId, setLoadId] = useState(null)
  const userId = localStorage.getItem('user_id')

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/map/events`),
      axios.get(`${API}/rsvps/${userId}`),
    ]).then(([mapRes, rsvpRes]) => {
      setEvents(mapRes.data)
      setRsvpd(new Set(rsvpRes.data.map(e => e.id)))
    })
  }, [userId])

  const handleRSVP = async (eventId) => {
    setLoadId(eventId)
    try {
      const res = await axios.post(`${API}/rsvp`, {
        user_id: userId, event_id: eventId
      })
      setRsvpd(prev => {
        const next = new Set(prev)
        res.data.action === 'added' ? next.add(eventId) : next.delete(eventId)
        return next
      })
      if (res.data.conflict) {
        alert(`⚠️ Clash with "${res.data.conflict}"`)
      }
    } catch (e) { console.error(e) }
    setLoadId(null)
  }

  const cats = ['all', ...new Set(events.map(e => e.category))]

  const filtered = filter === 'all'
    ? events
    : events.filter(e => e.category === filter)

  // Centre map on first event
  const center = events.length > 0
    ? [events[0].lat, events[0].lng]
    : [22.578, 88.432]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Campus Map</h1>
      <p className="text-sm text-gray-500 mb-4">
        Click any pin to RSVP directly on the map
      </p>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium
              border transition-all capitalize
              ${filter === c
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
        style={{ height: 480 }}>
        {events.length > 0 && (
          <MapContainer center={center} zoom={16}
            style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {filtered.map(e => (
              <CircleMarker
                key={e.id}
                center={[e.lat, e.lng]}
                radius={8 + Math.min(e.rsvp_count / 30, 10)}
                pathOptions={{
                  color: CAT_COLORS[e.category] || '#888',
                  fillColor: CAT_COLORS[e.category] || '#888',
                  fillOpacity: 0.85,
                  weight: 2,
                }}>
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <div style={{
                      fontWeight: 600, fontSize: 13,
                      marginBottom: 4, color: '#1e1b4b'
                    }}>
                      {e.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>
                      📍 {e.venue}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
                      🎫 {e.rsvp_count} going
                    </div>
                    <button
                      onClick={() => handleRSVP(e.id)}
                      disabled={loadId === e.id}
                      style={{
                        width: '100%', padding: '6px 0',
                        borderRadius: 8, border: 'none',
                        background: rsvpd.has(e.id) ? '#22c55e' : '#6366f1',
                        color: 'white', fontWeight: 600,
                        fontSize: 12, cursor: 'pointer'
                      }}>
                      {loadId === e.id ? '...'
                        : rsvpd.has(e.id) ? '✓ Going' : 'RSVP'}
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {Object.entries(CAT_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-3 h-3 rounded-full"
              style={{ background: color }} />
            {cat}
          </div>
        ))}
      </div>
    </div>
  )
}
