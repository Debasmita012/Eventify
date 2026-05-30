import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import API from '../config'

export default function EventAnalytics() {
  const { id } = useParams()
  const navigate = useNavigate()
  const organizerId = localStorage.getItem('user_id')

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Budget forms states
  const [revLabel, setRevLabel] = useState('')
  const [revAmount, setRevAmount] = useState(0)
  const [expLabel, setExpLabel] = useState('')
  const [expAmount, setExpAmount] = useState(0)
  
  const [sponName, setSponName] = useState('')
  const [sponTier, setSponTier] = useState('Bronze')
  const [sponAmount, setSponAmount] = useState(0)

  const [updatingBudget, setUpdatingBudget] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [id])

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API}/analytics/${id}`)
      setData(res.data)
      setLoading(false)
    } catch (err) {
      console.error(err)
      alert('Failed to load deep analytics.')
      navigate('/organizer')
    }
  }

  const handleAddBudgetRecord = async (type, label, amount) => {
    if (!label.trim() || amount <= 0) return
    setUpdatingBudget(true)
    
    // Construct updated budget structure
    const currentBudget = data.budget || {}
    const revenues = [...(currentBudget.revenue || [])]
    const expenses = [...(currentBudget.expenses || [])]
    const sponsors = [...(currentBudget.sponsors || [])]

    if (type === 'revenue') {
      revenues.push({ label: label.trim(), amount: parseFloat(amount) })
      setRevLabel('')
      setRevAmount(0)
    } else if (type === 'expense') {
      expenses.push({ label: label.trim(), amount: parseFloat(amount) })
      setExpLabel('')
      setExpAmount(0)
    }

    try {
      await axios.post(`${API}/events/${id}/budget`, {
        organizer_id: organizerId,
        revenue: revenues,
        expenses,
        sponsors
      })
      fetchAnalytics()
    } catch (err) {
      alert('Failed to update budget.')
    }
    setUpdatingBudget(false)
  }

  const handleAddSponsor = async (e) => {
    e.preventDefault()
    if (!sponName.trim() || sponAmount <= 0) return
    setUpdatingBudget(true)

    const currentBudget = data.budget || {}
    const revenues = [...(currentBudget.revenue || [])]
    const expenses = [...(currentBudget.expenses || [])]
    const sponsors = [...(currentBudget.sponsors || [])]

    sponsors.push({
      name: sponName.trim(),
      tier: sponTier,
      amount: parseFloat(sponAmount),
      logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100"
    })

    // Auto-add sponsor amount to revenues too for completeness
    revenues.push({ label: `Sponsor: ${sponName.trim()} (${sponTier})`, amount: parseFloat(sponAmount) })

    try {
      await axios.post(`${API}/events/${id}/budget`, {
        organizer_id: organizerId,
        revenue: revenues,
        expenses,
        sponsors
      })
      setSponName('')
      setSponAmount(0)
      fetchAnalytics()
    } catch (err) {
      alert('Failed to add sponsor.')
    }
    setUpdatingBudget(false)
  }

  const handleClearBudget = async () => {
    if (!confirm('Clear all budget items?')) return
    setUpdatingBudget(true)
    try {
      await axios.post(`${API}/events/${id}/budget`, {
        organizer_id: organizerId,
        revenue: [],
        expenses: [],
        sponsors: []
      })
      fetchAnalytics()
    } catch (err) {
      alert('Failed to clear budget.')
    }
    setUpdatingBudget(false)
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-indigo-600">
        <div className="text-center">
          <div className="text-4xl mb-2 animate-bounce">📊</div>
          <p className="text-sm font-semibold text-slate-500">Computing analytics engines...</p>
        </div>
      </div>
    )
  }

  const hourlyData = Object.entries(data.hourly || {})
    .map(([h, c]) => ({ hour: `${h}:00`, RSVPs: c }))
    .filter(x => x.RSVPs > 0) // only active hours

  const deptData = Object.entries(data.departments || {})
    .map(([d, c]) => ({ department: d, Attendees: c }))
    .sort((a, b) => b.Attendees - a.Attendees)

  const checkinData = Object.entries(data.checkin_hourly || {})
    .map(([h, c]) => ({ hour: `${h}:00`, CheckIns: c }))
    .filter(x => x.CheckIns > 0)

  // Radar metrics mapping
  const radarData = [
    { subject: 'RSVPs Reach', A: Math.min(100, Math.round((data.total_rsvps / (data.event.expected_audience || 150)) * 100)) },
    { subject: 'Check-in Rate', A: data.checkin_rate },
    { subject: 'Average Review', A: data.avg_rating * 20 },
    { subject: 'Poll Vote %', A: data.poll_participation },
    { subject: 'Feedback %', A: data.feedback_rate },
    { subject: 'Cert Conversion', A: Math.min(100, Math.round((data.cert_conversions / (data.total_rsvps || 1)) * 100)) }
  ]

  // Star distribution mapping
  const starDist = Object.entries(data.rating_dist || {})
    .map(([stars, count]) => ({ name: `${stars} ★`, Count: count }))

  // Calculate totals
  const totalRevenue = (data.budget?.revenue || []).reduce((sum, item) => sum + item.amount, 0)
  const totalExpense = (data.budget?.expenses || []).reduce((sum, item) => sum + item.amount, 0)
  const netProfit = totalRevenue - totalExpense

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-slate-50 min-h-screen rounded-2xl shadow-inner">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button onClick={() => navigate('/organizer')}
            className="text-slate-400 hover:text-slate-700 text-xs mb-2 transition">
            ← Back to Portal
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {data.event.title}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            📍 {data.event.venue} · Complete Success & Performance Analytics
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/operations/${id}`)}
            className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-red-200">
            🔴 Live Operations Room
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total RSVPs', value: data.total_rsvps, icon: '🎫', color: 'text-indigo-600' },
          { label: 'Check-In Conversion', value: `${data.checkin_rate}%`, icon: '✅', color: 'text-emerald-600' },
          { label: 'Avg Rating Review', value: `${data.avg_rating} ★`, icon: '⭐', color: 'text-amber-500' },
          { label: 'Engagement Score', value: `${data.engagement_score}%`, icon: '🔥', color: 'text-pink-600' },
          { label: 'Platform Success', value: `${data.success_score}%`, icon: '📈', color: 'text-violet-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm text-center">
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className={`text-2xl font-black ${k.color}`}>
              {k.value}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 mt-1.5 tracking-wider">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Primary Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Hourly RSVPs trend */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4">🎫 RSVPs Velocity & Demand Rate</h3>
          {hourlyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">No hourly timestamp logs yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="RSVPs" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Check-in attendance timeline */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4">👥 Real Check-Ins Distribution Timeline</h3>
          {checkinData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">Waiting for check-in logs...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={checkinData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="CheckIns" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Middle Performance Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Success Score radar */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4">🕸 Multi-Metric Engagement Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart outerRadius={70} data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#64748b' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
              <Radar name="Performance" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Spread */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm col-span-2">
          <h3 className="font-bold text-slate-800 text-sm mb-4">🏛 Attendance / RSVPs Department Diversity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="department" tick={{ fontSize: 10 }} width={100} />
              <Tooltip />
              <Bar dataKey="Attendees" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* After Event Ratings, Reviews & Certificate conversions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Star distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4">⭐ Review Ratings Spread</h3>
          {data.feedback_count === 0 ? (
            <div className="h-44 flex items-center justify-center text-slate-400 text-xs">No feedback reviews recorded yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={185}>
              <BarChart data={starDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="Count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Feedback comments */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex flex-col h-[260px]">
          <h3 className="font-bold text-slate-800 text-sm mb-4">💬 Live Participant Review Comments</h3>
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
            {data.feedback_comments?.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No textual reviews submitted</div>
            ) : (
              data.feedback_comments?.map((c, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-amber-500 font-bold">{'★'.repeat(c.rating)}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {c.submitted_at ? new Date(c.submitted_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium">{c.comment || "(Empty rating review comment)"}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Finance, Revenue & Expense analysis plus sponsor tier tracker */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">💰 Event Revenue, Expenses & Sponsor Tracking</h3>
            <p className="text-xs text-slate-400 mt-0.5">Budget ledger and financials analysis dashboard</p>
          </div>
          <div className="flex gap-2 mt-3 md:mt-0">
            <button 
              onClick={handleClearBudget}
              className="text-xs bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition"
            >
              Clear Ledger
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Ledger */}
          <div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 mb-4">
              <h4 className="font-bold text-emerald-700 text-xs uppercase tracking-wider mb-3">🟢 Revenues ledger</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {(data.budget?.revenue || []).length === 0 ? (
                  <div className="text-slate-400 text-xs italic">No revenue recorded yet</div>
                ) : (
                  (data.budget.revenue).map((r, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-600">{r.label}</span>
                      <span className="font-mono font-bold text-slate-700">₹{r.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 border-t border-slate-200 pt-2 flex justify-between font-bold text-xs text-emerald-800">
                <span>TOTAL REVENUE</span>
                <span className="font-mono">₹{totalRevenue.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Revenue label" 
                value={revLabel}
                onChange={e => setRevLabel(e.target.value)}
                className="w-1/2 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
              />
              <input 
                type="number" 
                placeholder="Amount" 
                value={revAmount || ''}
                onChange={e => setRevAmount(parseFloat(e.target.value) || 0)}
                className="w-1/4 bg-white border border-slate-200 rounded-xl px-2 text-xs focus:outline-none"
              />
              <button 
                onClick={() => handleAddBudgetRecord('revenue', revLabel, revAmount)}
                disabled={updatingBudget}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2 rounded-xl"
              >
                +
              </button>
            </div>
          </div>

          {/* Expenses Ledger */}
          <div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 mb-4">
              <h4 className="font-bold text-red-700 text-xs uppercase tracking-wider mb-3">🔴 Expenses ledger</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {(data.budget?.expenses || []).length === 0 ? (
                  <div className="text-slate-400 text-xs italic">No expenses recorded yet</div>
                ) : (
                  (data.budget.expenses).map((e, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-600">{e.label}</span>
                      <span className="font-mono font-bold text-slate-700">₹{e.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 border-t border-slate-200 pt-2 flex justify-between font-bold text-xs text-red-800">
                <span>TOTAL EXPENSES</span>
                <span className="font-mono">₹{totalExpense.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Expense label" 
                value={expLabel}
                onChange={e => setExpLabel(e.target.value)}
                className="w-1/2 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
              />
              <input 
                type="number" 
                placeholder="Amount" 
                value={expAmount || ''}
                onChange={e => setExpAmount(parseFloat(e.target.value) || 0)}
                className="w-1/4 bg-white border border-slate-200 rounded-xl px-2 text-xs focus:outline-none"
              />
              <button 
                onClick={() => handleAddBudgetRecord('expense', expLabel, expAmount)}
                disabled={updatingBudget}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-2 rounded-xl"
              >
                +
              </button>
            </div>
          </div>

          {/* Sponsors Ledger */}
          <div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 mb-4">
              <h4 className="font-bold text-indigo-700 text-xs uppercase tracking-wider mb-3">🏆 Sponsors performance</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {(data.budget?.sponsors || []).length === 0 ? (
                  <div className="text-slate-400 text-xs italic">No sponsors onboarded</div>
                ) : (
                  (data.budget.sponsors).map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full 
                          ${s.tier === 'Gold' ? 'bg-amber-400' : s.tier === 'Silver' ? 'bg-slate-450' : 'bg-orange-400'}`}
                        ></span>
                        <span className="text-slate-700 font-semibold">{s.name}</span>
                      </div>
                      <span className="font-mono text-indigo-600 font-bold">₹{s.amount.toLocaleString()} ({s.tier})</span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 border-t border-slate-200 pt-2 flex justify-between font-bold text-xs text-indigo-800">
                <span>NET PROFIT / LOSS</span>
                <span className={`font-mono ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  ₹{netProfit.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleAddSponsor} className="flex gap-1.5">
              <input 
                type="text" 
                placeholder="Sponsor name" 
                value={sponName}
                onChange={e => setSponName(e.target.value)}
                className="w-1/3 bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs focus:outline-none"
              />
              <select 
                value={sponTier}
                onChange={e => setSponTier(e.target.value)}
                className="w-1/3 bg-white border border-slate-200 rounded-xl px-1 text-xs focus:outline-none"
              >
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
              </select>
              <input 
                type="number" 
                placeholder="Amt" 
                value={sponAmount || ''}
                onChange={e => setSponAmount(parseFloat(e.target.value) || 0)}
                className="w-1/4 bg-white border border-slate-200 rounded-xl px-1.5 text-xs focus:outline-none"
              />
              <button 
                type="submit" 
                disabled={updatingBudget}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-2 rounded-xl"
              >
                +
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
