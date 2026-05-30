import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import API from '../config'

export default function Analytics() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)

  useEffect(() => {
    axios.get(`${API}/analytics/${id}`)
      .then(r => setData(r.data))
      .catch(() => navigate('/organizer'))
  }, [id, navigate])

  if (!data) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      Loading analytics...
    </div>
  )

  const hourlyData = Object.entries(data.hourly)
    .map(([h, c]) => ({ hour: `${h}:00`, count: c }))

  const deptData = Object.entries(data.departments)
    .map(([d, c]) => ({ dept: d, count: c }))
    .sort((a, b) => b.count - a.count)

  // Heatmap
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const slots = ['8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm']
  const peakHour = parseInt(
    Object.entries(data.hourly).sort((a, b) => b[1] - a[1])[0]?.[0] || '18'
  )

  const scoreColor = data.success_score >= 70
    ? 'text-green-600' : data.success_score >= 40
      ? 'text-yellow-600' : 'text-red-500'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <button onClick={() => navigate('/organizer')}
        className="text-gray-400 hover:text-gray-700 text-sm mb-4 transition">
        ← Back to Portal
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {data.event.title}
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        {data.event.venue} · Analytics Dashboard
      </p>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total RSVPs', value: data.total_rsvps, icon: '🎫' },
          { label: 'Departments', value: Object.keys(data.departments).length, icon: '🏛' },
          { label: 'Peak Hour', value: `${peakHour}:00`, icon: '⏰' },
          {
            label: 'Success Score', value: `${data.success_score}%`, icon: '📈',
            extraClass: scoreColor
          },
        ].map(k => (
          <div key={k.label}
            className="bg-white rounded-2xl border border-gray-100 p-4
              text-center shadow-sm">
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className={`text-2xl font-bold ${k.extraClass || 'text-indigo-600'}`}>
              {k.value}
            </div>
            <div className="text-xs text-gray-400 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Hourly trend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-gray-700 mb-4">
            RSVP activity by hour
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count"
                stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Department breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-gray-700 mb-4">
            Attendance by department
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={deptData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="dept"
                tick={{ fontSize: 10 }} width={90} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
        <h3 className="font-semibold text-sm text-gray-700 mb-4">
          Weekly activity heatmap
        </h3>
        <div className="overflow-x-auto">
          <div style={{
            display: 'grid',
            gridTemplateColumns: `50px repeat(${slots.length}, 1fr)`,
            gap: 4
          }}>
            <div />
            {slots.map(s => (
              <div key={s}
                className="text-center text-xs text-gray-400 pb-1">
                {s}
              </div>
            ))}
            {days.map((day, di) => (
              <>
                <div key={day}
                  className="text-xs text-gray-400 flex items-center">
                  {day}
                </div>
                {slots.map((_, si) => {
                  const base = [0, 0, 1, 2, 3, 5, 3, 1][si]
                  const wday = di < 5 ? 1 : 0.3
                  const op = Math.min(0.9, (base * wday) / 5)
                  return (
                    <div key={si} style={{
                      height: 22,
                      borderRadius: 4,
                      background: `rgba(99,102,241,${op})`,
                      border: '1px solid rgba(99,102,241,0.08)'
                    }}
                      title={`${day} ${slots[si]}`} />
                  )
                })}
              </>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-xs text-gray-400">Low</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map(o => (
            <div key={o} style={{
              width: 16, height: 16, borderRadius: 3,
              background: `rgba(99,102,241,${o})`
            }} />
          ))}
          <span className="text-xs text-gray-400">High</span>
        </div>
      </div>

      {/* Success score bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-sm text-gray-700 mb-3">
          Event success score
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full h-3">
            <div className="h-3 rounded-full transition-all duration-700"
              style={{
                width: `${data.success_score}%`,
                background: data.success_score >= 70
                  ? '#22c55e' : data.success_score >= 40
                    ? '#eab308' : '#ef4444'
              }} />
          </div>
          <span className={`font-bold text-lg ${scoreColor}`}>
            {data.success_score}%
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Based on RSVP count and department spread.
          {data.success_score < 50 && ' Consider promoting to more departments.'}
          {data.success_score >= 80 && ' Excellent engagement!'}
        </p>
      </div>

    </div>
  )
}
