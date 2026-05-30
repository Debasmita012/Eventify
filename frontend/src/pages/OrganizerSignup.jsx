import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API from '../config'

export default function OrganizerSignup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const isValid = form.name.trim() && form.email.trim() && form.password.trim() && form.department.trim()

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API}/onboard`, {
        ...form,
        role: 'organizer',
        interests: [] // Organizers don't need interests
      })
      localStorage.setItem('user_id', res.data.user_id)
      localStorage.setItem('user_name', res.data.name)
      localStorage.setItem('user_role', res.data.role)
      localStorage.setItem('user_dept', res.data.department)
      
      // Go directly to organizer portal
      navigate('/organizer')
    } catch (err) {
      console.error(err)
      const detail = err?.response?.data?.detail
      setError(detail || "Could not connect to backend.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50
      flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📋</div>
          <h1 className="text-2xl font-bold text-gray-900">Organizer Signup</h1>
          <p className="text-gray-500 mt-1 text-sm">Create an account to host events</p>
        </div>

        <div className="space-y-3 mb-6">
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3
              focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
            placeholder="Your full name"
            value={form.name}
            onChange={e => { setError(''); setForm({ ...form, name: e.target.value }) }}
          />
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3
              focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
            placeholder="Organization or Club Email"
            type="email"
            value={form.email}
            onChange={e => { setError(''); setForm({ ...form, email: e.target.value }) }}
          />
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3
              focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={e => { setError(''); setForm({ ...form, password: e.target.value }) }}
          />
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3
              focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
            placeholder="Organization Name (e.g. Tech Club)"
            value={form.department}
            onChange={e => { setError(''); setForm({ ...form, department: e.target.value }) }}
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}

        <button
          disabled={!isValid || loading}
          onClick={submit}
          className="w-full bg-purple-600 text-white rounded-xl py-3 font-semibold
            hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed mb-4">
          {loading ? 'Creating Account...' : 'Create Organizer Account'}
        </button>
        
        <div className="text-center">
          <button onClick={() => navigate('/onboard')} className="text-gray-500 text-sm font-semibold hover:underline">
            ← Back to Student Sign Up
          </button>
        </div>
        
      </div>
    </div>
  )
}
