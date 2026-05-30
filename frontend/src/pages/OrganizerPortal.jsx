import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API from '../config'
const CATS = ['tech', 'cultural', 'sports', 'music', 'career', 'wellness', 'gaming']

export default function OrganizerPortal() {
  const [events, setEvents] = useState([])
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', category: 'tech',
    venue: '', datetime: '', why_it_matters: ''
  })
  const userId = localStorage.getItem('user_id')
  const navigate = useNavigate()

  const loadEvents = async () => {
    const res = await axios.get(`${API}/events`)
    setEvents(res.data)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEvents()
  }, [])

  const submit = async () => {
    if (!form.title || !form.description || !form.venue || !form.datetime) {
      return alert('Please fill all required fields')
    }
    setLoading(true)
    try {
      await axios.post(`${API}/events`, { ...form, organizer_id: userId })
      setSuccess('Event published successfully! ✅')
      setForm({
        title: '', description: '', category: 'tech',
        venue: '', datetime: '', why_it_matters: ''
      })
      loadEvents()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      alert('Failed to create event — is the backend running?')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Organizer Portal</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* ── Create Event Form ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-5">Create New Event</h2>

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200
              text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
              {success}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Event title *
              </label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                  text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="e.g. Tech Talk: AI in 2025"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Description *
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                  text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400
                  h-24 resize-none"
                placeholder="What's happening, who should attend, what to bring..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Category *
                </label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                    text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATS.map(c => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Venue *
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                    text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="e.g. Main Auditorium"
                  value={form.venue}
                  onChange={e => setForm({ ...form, venue: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Date & Time *
              </label>
              <input type="datetime-local"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                  text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.datetime}
                onChange={e => setForm({ ...form, datetime: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Why it matters (optional)
              </label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                  text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="e.g. Resume boost + MAR points"
                value={form.why_it_matters}
                onChange={e => setForm({ ...form, why_it_matters: e.target.value })}
              />
            </div>

            <button onClick={submit} disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-xl py-3
                font-semibold hover:bg-indigo-700 transition disabled:opacity-50
                disabled:cursor-not-allowed">
              {loading ? 'Publishing...' : '🚀 Publish Event'}
            </button>
          </div>
        </div>

        {/* ── Events List ── */}
        <div>
          <h2 className="font-semibold text-lg mb-4">
            All Events ({events.length})
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {events.map(e => (
              <div key={e.id}
                onClick={() => navigate(`/analytics/${e.id}`)}
                className="bg-white border border-gray-100 rounded-xl p-4
                  flex items-center justify-between hover:shadow-sm
                  cursor-pointer transition group">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {e.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {e.venue} · {e.rsvp_count} RSVPs
                  </div>
                </div>
                <span className="text-indigo-500 text-xs font-medium
                  group-hover:text-indigo-700 transition whitespace-nowrap">
                  Analytics →
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
