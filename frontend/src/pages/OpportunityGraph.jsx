import { useState, useEffect } from 'react'
import axios from 'axios'
import API from '../config'

export default function OpportunityGraph() {
  const userId = localStorage.getItem('user_id')
  
  // States
  const [overlaps, setOverlaps] = useState([])
  const [mentors, setMentors] = useState([])
  const [clubs, setClubs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [activeTab, setActiveTab] = useState('overlap') // 'overlap' | 'mentors' | 'clubs' for mobile toggle
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    fetchGraphData()
  }, [userId])

  const fetchGraphData = async () => {
    setLoading(true)
    try {
      const [overlapRes, clubsRes] = await Promise.all([
        axios.get(`${API}/graph/${userId}/overlap`),
        axios.get(`${API}/graph/${userId}/clubs`)
      ])
      setOverlaps(overlapRes.data || [])
      setClubs(clubsRes.data || [])
      
      // Default initial search for mentors
      const mentorRes = await axios.get(`${API}/graph/${userId}/mentors?q=tech`)
      setMentors(mentorRes.data || [])
    } catch (err) {
      console.error("Error fetching graph data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchMentors = async (e) => {
    e.preventDefault()
    setSearching(true)
    try {
      const res = await axios.get(`${API}/graph/${userId}/mentors?q=${encodeURIComponent(searchQuery)}`)
      setMentors(res.data || [])
    } catch (err) {
      console.error("Error searching mentors:", err)
    } finally {
      setSearching(false)
    }
  }

  const showToast = (msg) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 2500)
  }

  const handleConnect = (name) => {
    showToast(`🔌 Nexus connection request sent to ${name}!`)
  }

  const handleJoinClub = (clubName) => {
    showToast(`🏰 Guild interest in '${clubName}' logged!`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent text-indigo-600 font-outfit">
        <div className="text-center mc-panel p-8 bg-white/95">
          <div className="text-4xl mb-4 animate-spin">🕸️</div>
          <p className="text-sm font-vt uppercase tracking-widest text-slate-800 animate-pulse">Tracing network link nodes...</p>
          <p className="text-xs text-slate-500 mt-2 font-bold font-mono">Mapping earned campus paths...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative pb-24">
      {/* Page Header */}
      <div className="mb-10 bg-indigo-50 border-4 border-indigo-700 p-8 relative overflow-hidden shadow-sm mc-panel">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none translate-x-12 translate-y-6">
          <span className="text-[150px] font-black text-indigo-800 leading-none">🕸️</span>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 border-4 border-indigo-800 flex items-center justify-center text-3xl text-white animate-pulse">
            🕸️
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl font-vt uppercase text-indigo-900 tracking-wider">
              Campus Opportunity Graph
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 font-outfit font-bold mt-1 max-w-2xl">
              Every student has a hidden achievement path. This graph maps overlaps, identifies peer mentors, and guides club alignment silently based on actual events attended and certificates earned.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs for Mobile View */}
      <div className="flex md:hidden gap-1 mb-6 border-b-4 border-slate-350 bg-white/50 p-1">
        {[
          { id: 'overlap', label: '🔗 Overlaps' },
          { id: 'mentors', label: '🎯 Mentors' },
          { id: 'clubs', label: '🧭 Club Compass' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-center font-vt py-2.5 text-sm uppercase tracking-wider transition-all border-b-4
              ${activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-800 bg-white font-black' 
                : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Column 1: Path Overlap Circle */}
        <div className={`space-y-6 ${activeTab === 'overlap' ? 'block' : 'hidden md:block'}`}>
          <div className="mc-panel p-6 bg-white/95 flex flex-col h-[600px]">
            <h2 className="text-2xl font-vt text-indigo-950 flex items-center gap-2 mb-1.5 uppercase tracking-wide">
              <span>🔗</span> Path Overlaps
            </h2>
            <p className="text-slate-500 text-xs font-semibold font-outfit mb-4">
              Students sharing your learning route and event footprints
            </p>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              {overlaps.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs font-bold">
                  No overlapping student trajectories found yet. Attend more fests/workshops!
                </div>
              ) : (
                overlaps.map((item, idx) => (
                  <div key={item.user_id} className="mc-card p-4 hover:border-indigo-500 transition relative">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-outfit font-black text-slate-800 text-xs">{item.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold">{item.department}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 border border-indigo-100">
                          {item.similarity}% match
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar of path overlap */}
                    <div className="w-full bg-slate-100 border border-slate-200 h-2 rounded-none mb-3 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full transition-all duration-500" 
                        style={{ width: `${item.similarity}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-600 italic leading-relaxed mb-3">
                      💡 {item.reason}
                    </p>

                    <div className="flex justify-between items-center gap-2">
                      <div className="flex flex-wrap gap-1">
                        {item.common_interests.slice(0, 2).map(skill => (
                          <span key={skill} className="bg-slate-100 text-slate-600 font-mono text-[9px] px-1 py-0.5">
                            #{skill}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleConnect(item.name)}
                        className="text-[9px] font-vt uppercase tracking-wider px-2 py-1 mc-btn bg-indigo-600 border-indigo-850 hover:bg-indigo-750"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Peer Mentors */}
        <div className={`space-y-6 md:col-span-1 ${activeTab === 'mentors' ? 'block' : 'hidden md:block'}`}>
          <div className="mc-panel p-6 bg-white/95 flex flex-col h-[600px]">
            <h2 className="text-2xl font-vt text-emerald-950 flex items-center gap-2 mb-1.5 uppercase tracking-wide">
              <span>🎯</span> Mentor Finder
            </h2>
            <p className="text-slate-500 text-xs font-semibold font-outfit mb-4">
              Peer veterans with actual certificates in domains you want to master
            </p>

            {/* Search Input Form */}
            <form onSubmit={handleSearchMentors} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type a skill e.g. hackathon, tech..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border-2 border-slate-350 focus:outline-none focus:border-emerald-600 text-xs font-outfit font-bold"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="absolute right-1.5 top-1 text-slate-400 hover:text-slate-600 p-1"
                >
                  {searching ? '⏳' : '🔍'}
                </button>
              </div>
            </form>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              {searching ? (
                <div className="text-center py-20 text-slate-400 text-xs font-bold animate-pulse">
                  Querying database nodes for certifications...
                </div>
              ) : mentors.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs font-bold">
                  No mentor candidates matching '{searchQuery || 'your query'}' yet. Try searching 'tech' or 'cultural'!
                </div>
              ) : (
                mentors.map((mentor) => (
                  <div key={mentor.user_id} className="mc-card p-4 hover:border-emerald-500 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-outfit font-black text-slate-800 text-xs">{mentor.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold">{mentor.department}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-vt uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5">
                          {mentor.points} XP
                        </span>
                      </div>
                    </div>

                    {/* Proof Credentials List */}
                    <div className="mt-2 space-y-1.5">
                      <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-1">Credibility Proof:</div>
                      {mentor.proof.map((pr, i) => (
                        <div key={i} className="text-[10px] text-slate-600 flex items-start gap-1 font-mono">
                          <span className="text-emerald-500">✔</span>
                          <span className="leading-tight">{pr}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center gap-2 mt-4 pt-2 border-t border-slate-100">
                      <div className="flex flex-wrap gap-1">
                        {mentor.interests.slice(0, 2).map(skill => (
                          <span key={skill} className="bg-slate-100 text-slate-600 font-mono text-[9px] px-1 py-0.5">
                            #{skill}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleConnect(mentor.name)}
                        className="text-[9px] font-vt uppercase tracking-wider px-2 py-1 mc-btn bg-emerald-600 border-emerald-850 hover:bg-emerald-700"
                      >
                        Ask Advice
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Club Compass */}
        <div className={`space-y-6 ${activeTab === 'clubs' ? 'block' : 'hidden md:block'}`}>
          <div className="mc-panel p-6 bg-white/95 flex flex-col h-[600px]">
            <h2 className="text-2xl font-vt text-amber-950 flex items-center gap-2 mb-1.5 uppercase tracking-wide">
              <span>🧭</span> Club Compass
            </h2>
            <p className="text-slate-500 text-xs font-semibold font-outfit mb-4">
              AI recommendations matching you with campus student guilds
            </p>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              {clubs.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs font-bold">
                  No matching clubs available for your profile.
                </div>
              ) : (
                clubs.map((club, idx) => (
                  <div key={club.club_id} className="mc-card p-4 hover:border-amber-500 transition relative">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-outfit font-black text-slate-800 text-xs">{club.name}</h4>
                      {idx === 0 && (
                        <span className="text-[9px] font-vt uppercase tracking-widest text-amber-700 bg-amber-100 border border-amber-200 px-1 py-0.5 animate-bounce">
                          ★ Best Fit
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-3">
                      {club.desc}
                    </p>

                    {/* Stat callout box */}
                    <div className="bg-amber-50/50 border border-amber-200/50 p-2.5 mb-3 text-[10px] text-amber-900 font-mono flex items-start gap-1.5 leading-snug">
                      <span className="text-amber-500 shrink-0">📊</span>
                      <span>{club.stat}</span>
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-100">
                      <div className="text-[9px] text-slate-400 font-mono font-bold">
                        Meetups: {club.activity}
                      </div>
                      <button
                        onClick={() => handleJoinClub(club.name)}
                        className="text-[9px] font-vt uppercase tracking-wider px-2 py-1 mc-btn bg-amber-600 border-amber-850 hover:bg-amber-700"
                      >
                        Join Guild
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Floating retro Toast notification */}
      {feedback && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999]
          bg-indigo-600 border-4 border-indigo-850 text-white text-sm font-vt uppercase tracking-widest px-6 py-4
          shadow-[4px_4px_0_rgba(0,0,0,0.2)] pointer-events-none animate-in slide-in-from-bottom-4 fade-in duration-300">
          {feedback}
        </div>
      )}
    </div>
  )
}
