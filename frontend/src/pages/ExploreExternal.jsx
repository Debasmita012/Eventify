import { useState, useEffect } from 'react'
import axios from 'axios'
import API from '../config'

const SOURCES = [
  { id: 'all',        label: 'All Sources',  icon: '🌐' },
  { id: 'devfolio',   label: 'Devfolio',     icon: '💻' },
  { id: 'unstop',     label: 'Unstop',       icon: '🏆' },
  { id: 'gdg',        label: 'GDG',          icon: '🔵' },
  { id: 'hack2skill', label: 'Hack2Skill',   icon: '⚡' },
]

const SOURCE_COLORS = {
  devfolio:   'bg-blue-100 text-blue-700',
  unstop:     'bg-orange-100 text-orange-700',
  gdg:        'bg-green-100 text-green-700',
  hack2skill: 'bg-purple-100 text-purple-700',
  campus:     'bg-indigo-100 text-indigo-700',
}

const SOURCE_ICONS = {
  devfolio:   '💻',
  unstop:     '🏆',
  gdg:        '🔵',
  hack2skill: '⚡',
  campus:     '🏫',
}

function ExternalEventCard({ event }) {
  const [saved, setSaved] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-gray-100
      overflow-hidden hover:shadow-md hover:-translate-y-0.5
      transition-all group">

      {/* Image */}
      <div className="h-36 overflow-hidden relative">
        <img src={event.image_url} alt={event.title}
          className="w-full h-full object-cover
            group-hover:scale-105 transition-transform duration-300"
          onError={e => {
            e.target.src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400'
          }}
        />
        {/* Source badge */}
        <span className={`absolute top-2 left-2 text-xs font-semibold
          px-2 py-1 rounded-full flex items-center gap-1
          ${SOURCE_COLORS[event.source] || 'bg-gray-100 text-gray-700'}`}>
          {SOURCE_ICONS[event.source]} {event.source}
        </span>
        {/* External indicator */}
        <span className="absolute top-2 right-2 text-xs bg-black/50
          text-white px-2 py-0.5 rounded-full">
          🌐 External
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm
          line-clamp-2 mb-1">
          {event.title}
        </h3>

        {event.why_it_matters && (
          <p className="text-xs text-indigo-600 font-medium mb-2">
            ✨ {event.why_it_matters}
          </p>
        )}

        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {event.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <span>📍 {event.venue}</span>
          {event.datetime && (
            <span>📅 {event.datetime.slice(0, 10)}</span>
          )}
        </div>

        {event.rsvp_count > 0 && (
          <div className="text-xs text-gray-500 mb-3">
            👥 {event.rsvp_count.toLocaleString()} registered
          </div>
        )}

        <div className="flex gap-2">
          <a href={event.source_url} target="_blank" rel="noreferrer"
            className="flex-1 bg-indigo-600 text-white text-xs
              font-semibold py-2 rounded-xl text-center
              hover:bg-indigo-700 transition">
            Register →
          </a>
          <button
            onClick={() => setSaved(s => !s)}
            className={`px-3 py-2 rounded-xl border text-xs transition
              ${saved
                ? 'bg-green-500 text-white border-green-500'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            {saved ? '✓' : '🔖'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ExploreExternal() {
  const [events,       setEvents]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [activeSource, setActiveSource] = useState('all')
  const [search,       setSearch]       = useState('')
  const [refreshing,   setRefreshing]   = useState(false)
  const [lastUpdated,  setLastUpdated]  = useState(null)

  const fetchEvents = async (source = 'all') => {
    setLoading(true)
    try {
      const url = source === 'all'
        ? `${API}/external-events`
        : `${API}/external-events?source=${source}`
      const res = await axios.get(url)
      setEvents(res.data)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (e) {
      console.error('External events error:', e)
    }
    setLoading(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await axios.get(`${API}/external-events/refresh`)
    await fetchEvents(activeSource)
    setRefreshing(false)
  }

  useEffect(() => { fetchEvents(activeSource) }, [activeSource])

  const filtered = events.filter(e =>
    !search ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🌐 Explore External Events
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Hackathons and competitions from Devfolio, Unstop, GDG, Hack2Skill and more
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">Last updated: {lastUpdated}</p>
          )}
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white
            border border-gray-200 rounded-xl text-sm text-gray-600
            hover:bg-gray-50 transition disabled:opacity-50">
          <span className={refreshing ? 'animate-spin inline-block' : ''}>🔄</span>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Source filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {SOURCES.map(s => (
          <button key={s.id} onClick={() => setActiveSource(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2
              rounded-full text-xs font-medium border transition-all
              ${activeSource === s.id
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-3 text-gray-400 text-sm">🔍</span>
        <input
          className="w-full pl-10 pr-4 py-3 rounded-2xl border
            border-gray-200 bg-white shadow-sm focus:outline-none
            focus:ring-2 focus:ring-indigo-400 text-sm"
          placeholder="Search hackathons, competitions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-2">🌐</div>
          <p className="text-sm">No external events found.</p>
          <button onClick={handleRefresh}
            className="mt-3 text-indigo-600 text-sm hover:underline">
            Try refreshing →
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{filtered.length} events found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(e => (
              <ExternalEventCard key={e.id} event={e} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
