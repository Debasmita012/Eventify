import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import API from '../config'

export default function EventOperations() {
  const { id } = useParams()
  const navigate = useNavigate()
  const organizerId = localStorage.getItem('user_id')

  const [event, setEvent] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [checkins, setCheckins] = useState([])
  const [crowd, setCrowd] = useState(null)
  const [operations, setOperations] = useState([])
  const [helpRequests, setHelpRequests] = useState([])
  const [loading, setLoading] = useState(true)

  // Simulation Form states
  const [scanUserId, setScanUserId] = useState('')
  const [scanZone, setScanZone] = useState('Main Hall')
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkInMsg, setCheckInMsg] = useState({ text: '', type: '' })

  // Help Desk new walk-in form
  const [walkinUserId, setWalkinUserId] = useState('')
  const [walkinCategory, setWalkinCategory] = useState('query')
  const [walkinMessage, setWalkinMessage] = useState('')
  const [submittingHelp, setSubmittingHelp] = useState(false)

  // F&B / Security / Parking edit states
  const [fbMeal, setFbMeal] = useState('Lunch')
  const [fbStatus, setFbStatus] = useState('serving')
  const [fbCount, setFbCount] = useState(0)

  const [secCheckpoint, setSecCheckpoint] = useState('Main Gate')
  const [secStatus, setSecStatus] = useState('Secure')

  const [pkgLot, setPkgLot] = useState('Lot A')
  const [pkgAvailable, setPkgAvailable] = useState(100)

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, 8000) // Poll operations every 8 seconds for semi-realtime feel
    return () => clearInterval(timer)
  }, [id])

  const fetchData = async () => {
    try {
      const [evRes, ciRes, crRes, opRes, hpRes] = await Promise.all([
        axios.get(`${API}/events/${id}`),
        axios.get(`${API}/events/${id}/checkins`),
        axios.get(`${API}/events/${id}/crowd`),
        axios.get(`${API}/events/${id}/operations`),
        axios.get(`${API}/events/${id}/help`),
      ])
      setEvent(evRes.data)
      setCheckins(ciRes.data)
      setCrowd(crRes.data)
      setOperations(opRes.data)
      setHelpRequests(hpRes.data)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const handleCheckInSimulate = async (e) => {
    e.preventDefault()
    if (!scanUserId.trim()) return
    setCheckingIn(true)
    setCheckInMsg({ text: '', type: '' })
    try {
      const res = await axios.post(`${API}/events/${id}/checkin`, {
        user_id: scanUserId.trim(),
        zone: scanZone
      })
      setCheckInMsg({ text: res.data.message || 'Check-in recorded! ✅', type: 'success' })
      setScanUserId('')
      fetchData()
    } catch (err) {
      setCheckInMsg({ 
        text: err.response?.data?.detail || 'Check-in failed. Check Student ID.', 
        type: 'error' 
      })
    }
    setCheckingIn(false)
  }

  const handleUpdateOperation = async (category, key, value, count = 0) => {
    try {
      await axios.post(`${API}/events/${id}/operations`, {
        organizer_id: organizerId,
        category,
        key,
        value,
        count
      })
      alert(`Updated operations for ${key}! ✅`)
      fetchData()
    } catch (err) {
      alert('Failed to update operations.')
    }
  }

  const handleResolveHelp = async (reqId) => {
    try {
      await axios.patch(`${API}/events/${id}/help/${reqId}`)
      fetchData()
    } catch (err) {
      alert('Failed to resolve request.')
    }
  }

  const handleCreateWalkinHelp = async (e) => {
    e.preventDefault()
    if (!walkinUserId.trim() || !walkinMessage.trim()) return
    setSubmittingHelp(true)
    try {
      await axios.post(`${API}/events/${id}/help`, {
        user_id: walkinUserId.trim(),
        category: walkinCategory,
        message: walkinMessage.trim()
      })
      setWalkinUserId('')
      setWalkinMessage('')
      fetchData()
    } catch (err) {
      alert('Failed to submit walk-in ticket.')
    }
    setSubmittingHelp(false)
  }

  if (loading || !event) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <div className="text-4xl mb-2 animate-bounce">🚦</div>
          <p className="text-sm text-slate-400">Loading operations console...</p>
        </div>
      </div>
    )
  }

  // Get active agenda session
  const activeSession = event.current_session || "Registration & Warmup"
  const nextSession = event.next_session || "Workshop Kickoff"

  // Filter operations by category
  const fbOps = operations.filter(o => o.category === 'food')
  const secOps = operations.filter(o => o.category === 'security')
  const pkgOps = operations.filter(o => o.category === 'parking')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button onClick={() => navigate('/organizer')}
            className="text-slate-400 hover:text-white text-xs mb-2 transition flex items-center gap-1">
            ← Back to Portal
          </button>
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">📡</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Live Operations Control
            </h1>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            {event.title} · {event.venue}
          </p>
        </div>
        
        {/* Status display */}
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span className="font-semibold text-red-400 tracking-wider">LIVE DASHBOARD</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{checkins.length} / {event.expected_audience || 150} checked-in</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mb-6 flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
        {[
          { id: 'overview', label: '🚦 Overview', desc: 'Crowd & Session Status' },
          { id: 'checkin', label: '👥 Check-in Desk', desc: 'Scan Tickets / Log Attendance' },
          { id: 'ops', label: '🛠 Management', desc: 'F&B, Security, Parking' },
          { id: 'help', label: '🆘 Help Desk', desc: 'Help Requests & Tickets' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-3 text-center rounded-lg transition duration-200 flex flex-col items-center justify-center
              ${activeTab === t.id 
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/50' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <span className="text-sm md:text-base font-semibold">{t.label}</span>
            <span className="text-[10px] hidden md:inline text-slate-300 font-normal">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Realtime stats card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4 flex items-center gap-2">
                  <span>🏢</span> Real-Time Crowd Heat Map & Zone Occupancy
                </h3>
                
                {/* SVG Visual Heat Map */}
                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-850 h-52 flex items-center justify-center relative mb-4">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 font-black text-6xl tracking-wider select-none text-indigo-500">
                    EVENT MAP
                  </div>
                  
                  {/* Dynamic Heat map zones */}
                  <div className="grid grid-cols-2 gap-4 w-full h-full relative z-10">
                    {/* Main Hall */}
                    <div className="border border-slate-800 rounded-xl p-3 flex flex-col justify-between transition bg-slate-900/60 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-red-600/10 opacity-75"></div>
                      <div className="relative z-10">
                        <span className="text-[10px] uppercase font-bold text-red-400">Zone A</span>
                        <h4 className="font-bold text-white text-sm">Main Hall (Auditorium)</h4>
                      </div>
                      <div className="relative z-10 flex justify-between items-end">
                        <span className="text-xs text-slate-400">Occupancy</span>
                        <span className="text-lg font-black text-white">{crowd?.zones?.find(z => z.name === 'Main Hall')?.count || 0}</span>
                      </div>
                    </div>
                    {/* Registration */}
                    <div className="border border-slate-800 rounded-xl p-3 flex flex-col justify-between transition bg-slate-900/60 relative overflow-hidden">
                      <div className="absolute inset-0 bg-blue-600/10 opacity-75"></div>
                      <div className="relative z-10">
                        <span className="text-[10px] uppercase font-bold text-blue-400">Zone B</span>
                        <h4 className="font-bold text-white text-sm">Registration Desk</h4>
                      </div>
                      <div className="relative z-10 flex justify-between items-end">
                        <span className="text-xs text-slate-400">Occupancy</span>
                        <span className="text-lg font-black text-white">{crowd?.zones?.find(z => z.name === 'Registration')?.count || 0}</span>
                      </div>
                    </div>
                    {/* Food Court */}
                    <div className="border border-slate-800 rounded-xl p-3 flex flex-col justify-between transition bg-slate-900/60 relative overflow-hidden">
                      <div className="absolute inset-0 bg-amber-600/10 opacity-75"></div>
                      <div className="relative z-10">
                        <span className="text-[10px] uppercase font-bold text-amber-400">Zone C</span>
                        <h4 className="font-bold text-white text-sm">Food Court</h4>
                      </div>
                      <div className="relative z-10 flex justify-between items-end">
                        <span className="text-xs text-slate-400">Occupancy</span>
                        <span className="text-lg font-black text-white">{crowd?.zones?.find(z => z.name === 'Food Court')?.count || 0}</span>
                      </div>
                    </div>
                    {/* Networking Zone */}
                    <div className="border border-slate-800 rounded-xl p-3 flex flex-col justify-between transition bg-slate-900/60 relative overflow-hidden">
                      <div className="absolute inset-0 bg-emerald-600/10 opacity-75"></div>
                      <div className="relative z-10">
                        <span className="text-[10px] uppercase font-bold text-emerald-400">Zone D</span>
                        <h4 className="font-bold text-white text-sm">Networking Lounge</h4>
                      </div>
                      <div className="relative z-10 flex justify-between items-end">
                        <span className="text-xs text-slate-400">Occupancy</span>
                        <span className="text-lg font-black text-white">{crowd?.zones?.find(z => z.name === 'Networking')?.count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress breakdown */}
                <div className="space-y-3">
                  {crowd?.zones?.map(z => (
                    <div key={z.name} className="flex items-center gap-3">
                      <div className="w-28 text-xs font-medium text-slate-400">{z.name}</div>
                      <div className="flex-1 bg-slate-800 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-indigo-500 transition-all duration-500" 
                          style={{ width: `${z.percentage}%` }}
                        ></div>
                      </div>
                      <div className="w-12 text-right text-xs font-semibold text-white">{z.count}</div>
                      <div className={`w-14 text-right text-[10px] font-bold uppercase rounded-md px-1.5 py-0.5 border
                        ${z.status === 'High' ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                        : z.status === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}
                      >
                        {z.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sessions status */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4">
                  ⏰ Real-Time Session Scheduling
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-indigo-950/40 border border-indigo-900/50 rounded-xl p-4">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">CURRENT LIVE SESSION</span>
                    <div className="text-lg font-black text-white mt-1">{activeSession}</div>
                    <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Active right now
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest font-mono">NEXT UP SESSION</span>
                    <div className="text-lg font-semibold text-slate-300 mt-1">{nextSession}</div>
                    <div className="text-xs text-slate-500 mt-2 font-mono">Starts in 30 mins</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side summary panel */}
            <div className="space-y-6">
              {/* Live counter */}
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 border border-indigo-800 rounded-2xl p-6 shadow-xl text-center">
                <div className="text-5xl font-black text-white tracking-tight animate-pulse mb-1">
                  {checkins.length}
                </div>
                <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Total Check-Ins Verified</div>
                <div className="mt-4 bg-slate-950/60 p-3 rounded-xl border border-indigo-950 text-left space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">RSVP Attendance Rate</span>
                    <span className="font-semibold text-indigo-300">{crowd?.total_checked_in ? Math.round(checkins.length / (event.rsvp_count || 1) * 100) : 0}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Target Headcount</span>
                    <span className="font-semibold text-white">{event.expected_audience || 150}</span>
                  </div>
                </div>
              </div>

              {/* Status snapshots */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4">
                  📢 Operation Snapshots
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">🍲 Food & Beverage</span>
                    <span className="text-xs font-semibold text-white">
                      {fbOps.length > 0 ? `${fbOps[0].key} is ${fbOps[0].value}` : 'No menu update'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">👮 Security Status</span>
                    <span className="text-xs font-semibold text-white">
                      {secOps.length > 0 ? `${secOps[0].key} is ${secOps[0].value}` : 'Secure'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">🚗 Parking Availability</span>
                    <span className="text-xs font-semibold text-white">
                      {pkgOps.length > 0 ? `${pkgOps[0].key}: ${pkgOps[0].value}` : 'Plenty'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'checkin' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Simulation scanner form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4 flex items-center gap-2">
                <span>🎫</span> Ticket Verification Console
              </h3>
              
              <form onSubmit={handleCheckInSimulate} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Select Check-in Station/Zone</label>
                  <select 
                    value={scanZone} 
                    onChange={e => setScanZone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Main Hall">Main Hall (Auditorium)</option>
                    <option value="Registration">Registration Gate</option>
                    <option value="Food Court">Food Court</option>
                    <option value="Networking">Networking Lounge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Enter Student ID / Scan Token</label>
                  <input 
                    type="text" 
                    value={scanUserId}
                    onChange={e => setScanUserId(e.target.value)}
                    placeholder="e.g. stud-001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    * Type a valid user id (e.g. stud-001, stud-002) to simulate scanning a ticket.
                  </p>
                </div>

                <button 
                  type="submit" 
                  disabled={checkingIn}
                  className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold text-xs hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {checkingIn ? 'Verifying Ticket...' : '⚡ Verify & Check In'}
                </button>
              </form>

              {checkInMsg.text && (
                <div className={`mt-4 px-4 py-3 rounded-xl text-xs font-semibold text-center border
                  ${checkInMsg.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                >
                  {checkInMsg.text}
                </div>
              )}
            </div>

            {/* Attendance logs */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col max-h-[500px]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4 flex items-center justify-between">
                <span>📋</span> Checked-In Attendees Logs
                <span className="text-[10px] text-slate-400">{checkins.length} students</span>
              </h3>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {checkins.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 text-xs">
                    No attendees checked in yet. Simulate check-in on the left console.
                  </div>
                ) : (
                  checkins.map((c, i) => (
                    <div key={i} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-400">{c.department} · ID: {c.user_id}</div>
                      </div>
                      <div className="text-right">
                        <div className="bg-indigo-600/10 border border-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-semibold inline-block">
                          {c.zone}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-1 font-mono">
                          {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ops' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Food management */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2">
                <span>🍱</span> Food & Beverage Control
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Meal category</label>
                  <select 
                    value={fbMeal} 
                    onChange={e => setFbMeal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Breakfast">Breakfast Menu</option>
                    <option value="Lunch">Lunch Buffet</option>
                    <option value="Snacks & Tea">Snacks & High Tea</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Operation Status</label>
                  <select 
                    value={fbStatus} 
                    onChange={e => setFbStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="serving">Serving Live</option>
                    <option value="closed">Closed / Finished</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Servings Counted</label>
                  <input 
                    type="number" 
                    value={fbCount}
                    onChange={e => setFbCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <button 
                  onClick={() => handleUpdateOperation('food', fbMeal, fbStatus, fbCount)}
                  className="w-full bg-amber-600 text-white rounded-xl py-2.5 font-bold text-xs hover:bg-amber-700 transition"
                >
                  Update Meal Status
                </button>
              </div>
            </div>

            {/* Security management */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 mb-4 flex items-center gap-2">
                <span>👮</span> Security Checkpoints
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Checkpoint / Gate</label>
                  <select 
                    value={secCheckpoint} 
                    onChange={e => setSecCheckpoint(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Main Gate">Main Entrance Gate</option>
                    <option value="Hall A Entry">Hall A Checking Desk</option>
                    <option value="VIP Backstage">VIP Backstage Gate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Security Status</label>
                  <select 
                    value={secStatus} 
                    onChange={e => setSecStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Secure">Secure & Quiet</option>
                    <option value="Congested">High Crowd Congestion</option>
                    <option value="Checkpoints Active">Active Inspection</option>
                  </select>
                </div>
                <button 
                  onClick={() => handleUpdateOperation('security', secCheckpoint, secStatus, 0)}
                  className="w-full bg-red-600 text-white rounded-xl py-2.5 font-bold text-xs hover:bg-red-700 transition"
                >
                  Update Security Status
                </button>
              </div>
            </div>

            {/* Parking management */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4 flex items-center gap-2">
                <span>🚗</span> Venue Parking Lots
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Parking Sector</label>
                  <select 
                    value={pkgLot} 
                    onChange={e => setPkgLot(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Lot A">North Lot A (Four Wheelers)</option>
                    <option value="Lot B">West Lot B (Two Wheelers)</option>
                    <option value="VIP Space">Front VIP Space</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Available Space Slots</label>
                  <input 
                    type="number" 
                    value={pkgAvailable}
                    onChange={e => setPkgAvailable(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <button 
                  onClick={() => handleUpdateOperation('parking', pkgLot, `${pkgAvailable} slots available`, pkgAvailable)}
                  className="w-full bg-indigo-600 text-white rounded-xl py-2.5 font-bold text-xs hover:bg-indigo-700 transition"
                >
                  Update Parking Count
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Submit New walkin request ticket */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 mb-4 flex items-center gap-2">
                <span>🆘</span> Create Walk-in Support Ticket
              </h3>
              <form onSubmit={handleCreateWalkinHelp} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Student ID (e.g. stud-001)</label>
                  <input 
                    type="text" 
                    value={walkinUserId}
                    onChange={e => setWalkinUserId(e.target.value)}
                    placeholder="stud-001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <select 
                    value={walkinCategory} 
                    onChange={e => setWalkinCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="query">General Query / Question</option>
                    <option value="lost-item">Lost & Found Item</option>
                    <option value="emergency">Urgent Crowd Emergency</option>
                    <option value="medical">Medical First Aid Desk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Problem Message</label>
                  <textarea 
                    value={walkinMessage}
                    onChange={e => setWalkinMessage(e.target.value)}
                    placeholder="Issue detail..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white h-20 resize-none focus:outline-none"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={submittingHelp}
                  className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold text-xs hover:bg-indigo-700 transition"
                >
                  {submittingHelp ? 'Logging ticket...' : '🚀 Submit Ticket'}
                </button>
              </form>
            </div>

            {/* List tickets */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-h-[500px] flex flex-col">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4 flex items-center justify-between">
                <span>🆘</span> Active Support Requests
                <span className="text-[10px] text-slate-400">{helpRequests.filter(r => !r.resolved).length} pending</span>
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {helpRequests.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 text-xs">
                    No help desk requests recorded.
                  </div>
                ) : (
                  helpRequests.map((r, i) => (
                    <div 
                      key={i} 
                      className={`border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs
                        ${r.resolved 
                          ? 'bg-slate-950/40 border-slate-900/60 opacity-60' 
                          : r.category === 'emergency' || r.category === 'medical'
                            ? 'bg-red-500/10 border-red-500/20'
                            : 'bg-slate-950 border-slate-850'}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-[9px] font-black uppercase rounded-md px-1.5 py-0.5 border
                            ${r.category === 'emergency' || r.category === 'medical'
                              ? 'bg-red-500/20 border-red-500/30 text-red-400' 
                              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}
                          >
                            {r.category}
                          </span>
                          <span className="font-semibold text-white">{r.name} ({r.department})</span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(r.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-300 font-medium leading-relaxed">{r.message}</p>
                      </div>

                      <div className="flex-shrink-0">
                        {r.resolved ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            ✓ Resolved
                          </span>
                        ) : (
                          <button
                            onClick={() => handleResolveHelp(r.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
