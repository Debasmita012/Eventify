import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API from '../config'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('user_id')

  const [student, setStudent] = useState(null)
  const [activities, setActivities] = useState([])
  const [networkingMatches, setNetworkingMatches] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [stats, setStats] = useState({ marPoints: 0, attendedCount: 0, rsvpsCount: 0, certificatesCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [userId])

  const fetchDashboardData = async () => {
    try {
      const [usrRes, actRes, netRes, recRes, certRes, rsvpRes] = await Promise.all([
        axios.get(`${API}/users/${userId}`),
        axios.get(`${API}/users/${userId}/activity`),
        axios.get(`${API}/users/${userId}/networking-matches`),
        axios.get(`${API}/recommend?user_id=${userId}`),
        axios.get(`${API}/certificates/${userId}`),
        axios.get(`${API}/rsvps/${userId}`),
      ])

      setStudent(usrRes.data)
      setActivities(actRes.data)
      setNetworkingMatches(netRes.data)
      setRecommendations(recRes.data || [])

      // Process stats
      const approvedCerts = certRes.data.filter(c => c.status === 'approved')
      const totalPoints = approvedCerts.reduce((sum, c) => sum + (c.mar_points || 0), 0)
      const checkinsCount = actRes.data.filter(a => a.type === 'checkin').length

      setStats({
        marPoints: totalPoints,
        attendedCount: checkinsCount,
        rsvpsCount: rsvpRes.data.length,
        certificatesCount: certRes.data.length
      })
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const handleConnectRequest = (name) => {
    alert(`Connection request sent to ${name}! Let's make networking fun. 🚀`)
  }

  if (loading || !student) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-indigo-600">
        <div className="text-center">
          <div className="text-4xl mb-2 animate-bounce">⚡</div>
          <p className="text-sm font-semibold text-slate-500">Connecting your student console...</p>
        </div>
      </div>
    )
  }

  // Badges milestones calculations
  const milestones = [
    { points: 25, badge: '⭐ Rising Starter', icon: '🌱' },
    { points: 50, badge: '🏆 Event Enthusiast', icon: '🎓' },
    { points: 100, badge: '🔥 Platform Champion', icon: '🚀' },
    { points: 200, badge: '👑 Legend Ambassador', icon: '💎' },
  ]
  const nextMilestone = milestones.find(m => stats.marPoints < m.points) || milestones[milestones.length - 1]
  const percentageToNext = Math.min(100, Math.round((stats.marPoints / nextMilestone.points) * 100))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-100 mb-8 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 font-bold text-[120px] select-none translate-y-12">
          CAMPUS
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img 
              src={`https://i.pravatar.cc/120?u=${student.id}`} 
              alt="Avatar" 
              className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white/20 shadow"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Hey, {student.name}! 👋
              </h1>
              <p className="text-indigo-100 text-xs md:text-sm mt-1">
                {student.department} · Year {student.year || 2} · ID: {student.id}
              </p>
            </div>
          </div>
          
          {/* Quick Point Stat */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3.5 border border-white/10 flex items-center gap-3">
            <span className="text-3xl">🏅</span>
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">MAR Points Vault</div>
              <div className="text-2xl font-black text-white">{stats.marPoints} <span className="text-xs font-normal text-indigo-150">pts</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Attended Events', value: stats.attendedCount, icon: '🏫', color: 'text-indigo-600' },
          { label: 'Total RSVPs', value: stats.rsvpsCount, icon: '🎫', color: 'text-emerald-600' },
          { label: 'Uploaded Certificates', value: stats.certificatesCount, icon: '🏅', color: 'text-amber-500' },
          { label: 'Network Overlaps', value: networkingMatches.length, icon: '👯‍♂️', color: 'text-pink-600' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm text-center">
            <div className="text-xl mb-0.5">{s.icon}</div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Primary columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Activity chronological feed */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col h-[520px]">
          <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <span>📅</span> Live Activity Timeline Feed
          </h3>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {activities.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-xs">
                No active records. RSVP to some events first!
              </div>
            ) : (
              activities.map((a, i) => (
                <div key={i} className="flex gap-3 relative">
                  {i !== activities.length - 1 && (
                    <span className="absolute left-3.5 top-7 bottom-0 w-0.5 bg-slate-100" />
                  )}
                  <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm relative z-15">
                    {a.icon}
                  </span>
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-slate-800 leading-snug">{a.label}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                      {a.timestamp ? new Date(a.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Middle column: Personalized recommendations + MAR Tracker */}
        <div className="space-y-6 lg:col-span-2">
          {/* MAR Tracker progress card */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
              <span>💎</span> Achievements & Milestone Progress
            </h3>
            <p className="text-slate-400 text-xs mb-4">Earn approved certificates to unlock higher tier MAR badges</p>

            <div className="mb-4">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Next milestone: {nextMilestone.badge}</span>
                <span className="text-indigo-600 font-mono">{stats.marPoints} / {nextMilestone.points} pts</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-700" 
                  style={{ width: `${percentageToNext}%` }}
                ></div>
              </div>
            </div>

            {/* Badges unlocked grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {milestones.map((m, idx) => {
                const unlocked = stats.marPoints >= m.points
                return (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl border text-center transition
                      ${unlocked 
                        ? 'bg-indigo-50/50 border-indigo-200 text-indigo-800' 
                        : 'bg-slate-50 border-slate-100 text-slate-350 opacity-50'}`}
                  >
                    <span className="text-2xl block mb-1">{m.icon}</span>
                    <span className="text-[10px] font-bold block leading-tight">{m.badge}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recommender Suggestions list */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <span>✨</span> Personalized Smart Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-slate-400 text-xs">
                  No direct category matches. Try browsing fests!
                </div>
              ) : (
                recommendations.slice(0, 2).map((rec, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => navigate(`/event/${rec.id}`)}
                    className="border border-slate-200/60 hover:border-indigo-300 rounded-xl p-3.5 bg-slate-50 hover:bg-indigo-50/10 transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {rec.category}
                        </span>
                        {rec.score && (
                          <span className="text-[9px] text-slate-400 font-bold">Match Score: {Math.round(rec.score * 100)}%</span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs leading-snug line-clamp-1">{rec.title}</h4>
                      <p className="text-slate-400 text-[10px] mt-1 leading-relaxed line-clamp-2">{rec.description}</p>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 font-medium flex items-center gap-1">
                      <span>📍</span> {rec.venue}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Networking Suggestions panel */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <span>👯‍♂️</span> Student Networking Match Suggestions
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {networkingMatches.length === 0 ? (
                <div className="col-span-2 text-center py-6 text-slate-400 text-xs">
                  Connect with students at events to show networking suggestions!
                </div>
              ) : (
                networkingMatches.map((m, idx) => (
                  <div key={idx} className="border border-slate-100 p-3.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[10px] text-slate-400">{m.department}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {m.common_skills.map(s => (
                          <span key={s} className="bg-indigo-50 text-indigo-700 text-[8px] font-bold px-1 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleConnectRequest(m.name)}
                      className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition"
                    >
                      Connect
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
