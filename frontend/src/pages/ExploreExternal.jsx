import { useState, useEffect } from 'react'
import axios from 'axios'
import API from '../config'

const SOURCES = [
  { id:'all',        label:'All',        icon:'🌐', color:'bg-indigo-600 text-white' },
  { id:'gdg',        label:'GDG',        icon:'🔵', color:'bg-blue-500 text-white'   },
  { id:'devfolio',   label:'Devfolio',   icon:'💻', color:'bg-purple-500 text-white' },
  { id:'unstop',     label:'Unstop',     icon:'🏆', color:'bg-orange-500 text-white' },
  { id:'hack2skill', label:'Hack2Skill', icon:'⚡', color:'bg-yellow-500 text-white' },
  { id:'luma',       label:'Luma',       icon:'🟣', color:'bg-pink-500 text-white'   },
]

const SOURCE_BADGE = {
  gdg:        'bg-blue-100 text-blue-700',
  devfolio:   'bg-purple-100 text-purple-700',
  unstop:     'bg-orange-100 text-orange-700',
  hack2skill: 'bg-yellow-100 text-yellow-700',
  luma:       'bg-pink-100 text-pink-700',
  campus:     'bg-indigo-100 text-indigo-700',
}

function EventCard({ event }) {
  const [saved, setSaved] = useState(false)
  const badge = SOURCE_BADGE[event.source] || 'bg-gray-100 text-gray-600'
  const src   = SOURCES.find(s => s.id === event.source)

  return (
    <div className="mc-card flex flex-col group relative overflow-hidden transition-all duration-300">

      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-slate-200 border-b-4 border-slate-300">
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => {
            e.target.src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400'
          }}
        />
        {/* Source badge */}
        <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-widest
          px-3 py-1 border-2 border-b-4 ${badge.replace('rounded-full', '')}`}>
          {src?.icon} {event.source_label || event.source}
        </span>
        {/* Live indicator */}
        {event.is_live_data && (
          <span className="absolute top-2 right-2 flex items-center
            gap-1 bg-green-500 border-2 border-green-700 border-b-4 text-white text-[10px] px-2 py-1
            font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-white
              animate-pulse inline-block" />
            Live
          </span>
        )}
        {/* Save button */}
        <button
          onClick={() => setSaved(s => !s)}
          className="absolute bottom-2 right-2 w-8 h-8 bg-white border-2 border-slate-300 border-b-4
            flex items-center justify-center text-sm
            hover:bg-slate-50 transition active:translate-y-[2px] active:border-b-2">
          {saved ? '🔖' : '🤍'}
        </button>
      </div>

      {/* Content */}

      <div className="p-4 flex flex-col flex-1 bg-white relative">
        <h3 className="font-vt font-black text-slate-800 text-2xl
          line-clamp-2 mb-2 leading-tight uppercase">
          {event.title}
        </h3>
        
        {/* Event Meta */}
        <div className="space-y-2 mt-auto font-outfit text-sm font-bold">
          <div className="flex items-start gap-2 text-slate-600">
            <span className="mt-0.5 text-xs">📅</span>
            <span className="line-clamp-1">{event.start_date || 'TBA'}</span>
          </div>
          
          {(event.venue || event.location) && (
            <div className="flex items-start gap-2 text-slate-600">
              <span className="mt-0.5 text-xs">📍</span>
              <span className="line-clamp-1">
                {event.venue || event.location}
              </span>
            </div>
          )}

          {event.prize_pool && (
            <div className="flex items-start gap-2 text-green-700">
              <span className="mt-0.5 text-xs">💰</span>
              <span className="line-clamp-1">{event.prize_pool}</span>
            </div>
          )}
        </div>

        <a
          href={event.source_url}
          target="_blank"
          rel="noreferrer"
          className="mc-btn mt-4 block text-center py-2.5 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <img src="/theme-assets/pickaxe.png" alt="Pickaxe" className="w-4 h-4" />
          View Details
        </a>
      </div>
    </div>
  )
}

export default function ExploreExternal() {
  const [events,       setEvents]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [activeSource, setActiveSource] = useState('all')
  const [search,       setSearch]       = useState('')
  const [stats,        setStats]        = useState(null)
  const [error,        setError]        = useState(null)

  const fetchEvents = async (source = 'all') => {
    setLoading(true)
    try {
      const url = source === 'all'
        ? `${API}/external-events`
        : `${API}/external-events?source=${source}`
      const res = await axios.get(url)
      setEvents(res.data)
      // Compute stats
      const live   = res.data.filter(e => e.is_live_data).length
      const static_ = res.data.filter(e => !e.is_live_data).length
      setStats({ total: res.data.length, live, static: static_ })
    } catch (e) {
      console.error('External events error:', e)
      setError('Failed to load events. Please try again later.')
    }
    setLoading(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await axios.get(`${API}/external-events/refresh`)
      await fetchEvents(activeSource)
    } catch {}
    setRefreshing(false)
  }

  useEffect(() => { fetchEvents(activeSource) }, [activeSource])

  const filtered = events.filter(e => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      e.title?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="mc-panel p-8 mb-6 flex flex-col md:flex-row items-center gap-6 bg-purple-50 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none mix-blend-multiply">
          <img src="/theme-assets/castle.png" alt="Castle" className="w-full h-full object-cover" />
        </div>
        <img src="/theme-assets/chest.png" alt="Chest" className="w-24 h-24 object-contain" />
        <div className="flex-1 text-center sm:text-left relative z-10">
          <h1 className="text-4xl sm:text-5xl font-vt text-slate-800 tracking-wider text-shadow-sm uppercase">
            External Events
          </h1>
          <p className="text-sm font-outfit font-bold text-slate-700 mt-2">
            Explore hackathons and competitions from GDG, Devfolio, Unstop, Luma and more!
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="mc-btn px-6 py-3 flex items-center justify-center gap-2 mt-4 md:mt-0 relative z-10 w-full md:w-auto">
          <span className={refreshing ? 'animate-spin inline-block' : ''}>🔄</span>
          {refreshing ? 'REFRESHING...' : 'REFRESH LIST'}
        </button>
      </div>

      {/* Live data indicator */}
      {stats && (
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs
            text-green-700 bg-green-50 px-3 py-1.5 rounded-full
            border border-green-200">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full
              animate-pulse inline-block" />
            {stats.live} live events
          </span>
          <span className="text-xs text-gray-500 bg-gray-100
            px-3 py-1.5 rounded-full">
            📋 {stats.static} curated events
          </span>
          <span className="text-xs text-gray-500">
            {stats.total} total
          </span>
        </div>
      )}

      {/* Source filters */}
      <div className="flex gap-2 flex-wrap mb-6 font-outfit">
        {SOURCES.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSource(s.id)}
            className={`mc-btn px-4 py-2 text-xs font-bold uppercase tracking-widest ${activeSource === s.id ? 'active' : ''}`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mc-panel p-4 mb-8 bg-blue-50 relative overflow-hidden">
        <img src="/theme-assets/wand.png" alt="Magic" className="absolute -right-4 -bottom-4 w-24 h-24 opacity-20 pointer-events-none" />
        <div className="relative w-full z-10">
          <span className="absolute left-5 top-4 text-slate-400 text-lg">✦</span>
          <input
            className="w-full pl-12 pr-4 py-4 border-4 border-slate-300 bg-white
              focus:outline-none focus:border-purple-500 transition-all text-sm
              text-slate-800 placeholder-slate-400 font-outfit font-bold"
            placeholder="Search hackathons, competitions, workshops..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 font-bold font-outfit border-2 border-red-300 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200/80 border-4 border-slate-300 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500 font-outfit mc-panel bg-amber-50">
          <img src="/theme-assets/chest.png" alt="Empty" className="w-24 h-24 mx-auto mb-4 opacity-50 grayscale" />
          <p className="text-lg uppercase tracking-widest font-bold">The treasure vault is empty.</p>
          <p className="text-xs mt-2 text-slate-600">No events found matching your mystical search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2
          lg:grid-cols-3 gap-4">
          {filtered.map(e => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  )
}
