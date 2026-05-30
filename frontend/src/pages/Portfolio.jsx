import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import API from '../config'

const CAT_COLORS = {
  tech: '#6366f1', cultural: '#a855f7', sports: '#22c55e',
  music: '#ec4899', career: '#eab308', wellness: '#14b8a6', gaming: '#ef4444'
}

export default function Portfolio() {
  const [data, setData] = useState(null)
  const userId = localStorage.getItem('user_id')

  useEffect(() => {
    axios.get(`${API}/portfolio/${userId}`).then(r => setData(r.data))
  }, [userId])

  if (!data) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-400">
      Loading portfolio...
    </div>
  )

  const chartData = Object.entries(data.category_breakdown || {})
    .map(([cat, cnt]) => ({ cat, count: cnt }))

  const badges = []
  if (data.total_rsvps >= 1) badges.push({ icon: '🌱', label: 'Explorer' })
  if (data.total_rsvps >= 5) badges.push({ icon: '⭐', label: 'Active' })
  if (data.total_rsvps >= 10) badges.push({ icon: '🏅', label: 'Pro' })
  if (data.total_rsvps >= 20) badges.push({ icon: '👑', label: 'Event Master' })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Portfolio</h1>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Events Attended', value: data.total_rsvps, icon: '🎫' },
          { label: 'MAR Points', value: data.mar_points, icon: '📊' },
          { label: 'Total Points', value: data.user?.points || 0, icon: '⚡' },
        ].map(k => (
          <div key={k.label}
            className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="text-2xl font-bold text-indigo-600">{k.value}</div>
            <div className="text-xs text-gray-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
          <h2 className="font-semibold text-sm text-gray-700 mb-3">Your Badges</h2>
          <div className="flex gap-3 flex-wrap">
            {badges.map(b => (
              <div key={b.label}
                className="flex items-center gap-2 bg-indigo-50 rounded-full
                  px-3 py-1.5 text-sm text-indigo-700 font-medium">
                {b.icon} {b.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
          <h2 className="font-semibold text-sm text-gray-700 mb-4">
            Events by Category
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <XAxis dataKey="cat" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}
                fill="#6366f1"
                label={{ position: 'top', fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Event list */}
      {data.events?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-sm text-gray-700 mb-3">
            Events I'm Attending ({data.events.length})
          </h2>
          <div className="space-y-2">
            {data.events.map(e => (
              <div key={e.id}
                className="flex items-center gap-3 py-2 border-b
                  border-gray-50 last:border-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0`}
                  style={{ background: CAT_COLORS[e.category] || '#888' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {e.title}
                  </div>
                  <div className="text-xs text-gray-400">{e.venue}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium`}
                  style={{
                    background: CAT_COLORS[e.category] + '20',
                    color: CAT_COLORS[e.category]
                  }}>
                  {e.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.total_rsvps === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-sm">RSVP to events to build your portfolio!</p>
        </div>
      )}
    </div>
  )
}
