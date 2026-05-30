import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API from '../config'

const getApiConnectionHint = () => "Could not connect to backend. Is it running on port 8000?"

const TAGS = [
  { id: 'tech', label: '💻 Tech', color: 'bg-blue-100 border-blue-400 text-blue-800' },
  { id: 'cultural', label: '🎭 Cultural', color: 'bg-purple-100 border-purple-400 text-purple-800' },
  { id: 'sports', label: '⚽ Sports', color: 'bg-green-100 border-green-400 text-green-800' },
  { id: 'music', label: '🎵 Music', color: 'bg-pink-100 border-pink-400 text-pink-800' },
  { id: 'career', label: '💼 Career', color: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
  { id: 'wellness', label: '🧘 Wellness', color: 'bg-teal-100 border-teal-400 text-teal-800' },
  { id: 'gaming', label: '🎮 Gaming', color: 'bg-red-100 border-red-400 text-red-800' },
]

const DEPTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Commerce', 'Science', 'Arts']

export default function Onboarding() {
  const [isLogin, setIsLogin] = useState(false)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' })
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const toggle = (id) => {
    setError('')
    setSelected(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id])
  }

  const step1Valid = form.name.trim() && form.email.trim() && form.password.trim() && form.department

  const loginSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API}/login`, {
        email: form.email, password: form.password
      })
      localStorage.setItem('user_id', res.data.user_id)
      localStorage.setItem('user_name', res.data.name)
      localStorage.setItem('user_role', res.data.role || 'student')
      localStorage.setItem('user_dept', res.data.department || '')
      navigate(res.data.role === 'organizer' ? '/organizer' : '/feed')
    } catch (err) {
      console.error(err)
      const detail = err?.response?.data?.detail
      setError(detail || getApiConnectionHint())
    }
    setLoading(false)
  }

  const submit = async () => {
    if (selected.length < 2) return setError('Pick at least 2 interests')
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API}/onboard`, {
        ...form, interests: selected
      })
      localStorage.setItem('user_id', res.data.user_id)
      localStorage.setItem('user_name', res.data.name)
      localStorage.setItem('user_role', res.data.role || 'student')
      localStorage.setItem('user_dept', res.data.department || form.department)
      navigate(res.data.role === 'organizer' ? '/organizer' : '/feed')
    } catch (err) {
      console.error(err)
      const detail = err?.response?.data?.detail
      setError(detail || getApiConnectionHint())
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50
      flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

        {isLogin ? (
          <>
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">👋</div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
              <p className="text-gray-500 mt-1 text-sm">Login to your account</p>
            </div>
            <div className="space-y-3 mb-6">
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                placeholder="Email address"
                type="email"
                value={form.email}
                onChange={e => { setError(''); setForm({ ...form, email: e.target.value }) }}
              />
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={e => { setError(''); setForm({ ...form, password: e.target.value }) }}
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
            <button
              disabled={loading || !form.email || !form.password}
              onClick={loginSubmit}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold
                hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed mb-4">
              {loading ? 'Logging in...' : 'Log In'}
            </button>
            <div className="text-center">
              <button onClick={() => { setIsLogin(false); setError(''); }} className="text-indigo-600 text-sm font-semibold hover:underline">
                Don't have an account? Sign up
              </button>
            </div>
          </>
        ) : step === 0 ? (
          <>
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🎓</div>
              <h1 className="text-2xl font-bold text-gray-900">Join Eventify</h1>
              <p className="text-gray-500 mt-1 text-sm">How would you like to use the platform?</p>
            </div>

            <div className="space-y-4 mb-6">
              <button
                onClick={() => setStep(1)}
                className="w-full text-left p-4 border-2 border-indigo-100 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition">
                <div className="font-bold text-gray-900 text-lg">👩‍🎓 I'm a Student</div>
                <div className="text-gray-500 text-sm mt-1">RSVP to events, earn MAR points, and build my portfolio.</div>
              </button>

              <button
                onClick={() => navigate('/organizer-signup')}
                className="w-full text-left p-4 border-2 border-purple-100 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition">
                <div className="font-bold text-gray-900 text-lg">📋 I'm an Organizer</div>
                <div className="text-gray-500 text-sm mt-1">Host events, manage attendees, and issue certificates.</div>
              </button>
            </div>

            <div className="text-center mt-6">
              <button onClick={() => { setIsLogin(true); setError(''); }} className="text-indigo-600 text-sm font-semibold hover:underline">
                Already have an account? Log In
              </button>
            </div>
          </>
        ) : step === 1 ? (
          <>
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">⚡</div>
              <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
              <p className="text-gray-500 mt-1 text-sm">Let's set up your account</p>
            </div>

            <div className="space-y-3 mb-6">
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                placeholder="Your full name"
                value={form.name}
                onChange={e => { setError(''); setForm({ ...form, name: e.target.value }) }}
              />
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                placeholder="College email"
                type="email"
                value={form.email}
                onChange={e => { setError(''); setForm({ ...form, email: e.target.value }) }}
              />
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={e => { setError(''); setForm({ ...form, password: e.target.value }) }}
              />
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-3
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                value={form.department}
                onChange={e => { setError(''); setForm({ ...form, department: e.target.value }) }}>
                <option value="">Select department</option>
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <button
              disabled={!step1Valid}
              onClick={() => setStep(2)}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold
                hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed mb-4">
              Continue →
            </button>
            <div className="text-center">
              <button onClick={() => setStep(0)} className="text-gray-500 text-sm font-semibold hover:underline">
                ← Back
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">What are you into?</h2>
              <p className="text-gray-500 text-sm mt-1">Pick at least 2 — we personalise your feed</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {TAGS.map(tag => (
                <button key={tag.id} onClick={() => toggle(tag.id)}
                  className={`px-4 py-2 rounded-full border-2 text-sm font-medium
                    transition-all select-none
                    ${selected.includes(tag.id)
                      ? tag.color + ' scale-105 shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {tag.label}
                </button>
              ))}
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl border border-gray-200 text-gray-500
                  hover:bg-gray-50 transition text-sm">
                ← Back
              </button>
              <button onClick={submit} disabled={loading || selected.length < 2}
                className="flex-1 bg-indigo-600 text-white rounded-xl py-3 font-semibold
                  hover:bg-indigo-700 transition disabled:opacity-40">
                {loading ? 'Setting up...' : '🚀 Go to my feed'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}