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
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 relative overflow-hidden bg-transparent">
      
      {/* MAGICAL CASTLE BACKGROUND */}
      <img src="/theme-assets/castle.png" alt="Castle" className="absolute inset-0 w-full h-full object-cover object-bottom opacity-30 z-0 pointer-events-none drop-shadow-2xl mix-blend-multiply" />

      <div className="mc-panel p-5 sm:p-8 md:p-10 w-full max-w-md relative z-10 animate-float" style={{ animationDuration: '8s' }}>

        {isLogin ? (
          <>
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl text-slate-800 font-vt mb-2 text-shadow-sm">Welcome Back</h1>
              <p className="text-slate-600 text-sm font-outfit font-bold">Authenticate to enter the nexus.</p>
            </div>
            <div className="space-y-4 mb-6 font-outfit">
              <input
                className="w-full bg-white border-4 border-slate-300 rounded-none px-4 py-3 text-slate-800 focus:outline-none focus:border-green-500 transition-all text-sm placeholder-slate-400 font-bold"
                placeholder="Email address"
                type="email"
                value={form.email}
                onChange={e => { setError(''); setForm({ ...form, email: e.target.value }) }}
              />
              <input
                className="w-full bg-white border-4 border-slate-300 rounded-none px-4 py-3 text-slate-800 focus:outline-none focus:border-green-500 transition-all text-sm placeholder-slate-400 font-bold"
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={e => { setError(''); setForm({ ...form, password: e.target.value }) }}
              />
            </div>
            {error && <p className="text-red-700 font-bold text-sm mb-4 text-center font-outfit bg-red-100 py-2 border-2 border-red-300">{error}</p>}
            
            <button
              disabled={loading || !form.email || !form.password}
              onClick={loginSubmit}
              className="w-full mc-btn py-3 mb-6 font-outfit tracking-wider disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'AUTHENTICATING...' : 'INITIATE LOGIN'}
            </button>
            
            <div className="text-center">
              <button onClick={() => { setIsLogin(false); setError(''); }} className="text-green-600 text-xs font-bold hover:text-green-700 transition-colors uppercase tracking-widest">
                Create New Entity
              </button>
            </div>
          </>
        ) : step === 0 ? (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl text-slate-800 font-vt mb-2 text-shadow-sm">Join Eventify</h1>
              <p className="text-slate-600 text-sm font-outfit font-bold">Select your role in the ecosystem.</p>
            </div>

            <div className="space-y-5 mb-8 font-outfit">
              <button
                onClick={() => setStep(1)}
                className="w-full text-left p-6 bg-white border-4 border-slate-800 shadow-[4px_4px_0_rgba(15,23,42,1)] hover:shadow-[8px_8px_0_rgba(34,197,94,1)] hover:-translate-y-1.5 active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(34,197,94,1)] transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="font-bold text-slate-800 text-lg relative z-10 flex items-center gap-3 font-outfit group-hover:text-green-700 transition-colors">
                  <span className="text-xl group-hover:scale-125 transition-transform duration-300 inline-block">⚡</span> Explorer (Student)
                </div>
                <div className="text-slate-500 font-medium text-xs mt-2 relative z-10 font-outfit group-hover:text-slate-700 transition-colors">Discover events, earn reputation, build legacy.</div>
              </button>

              <button
                onClick={() => navigate('/organizer-signup')}
                className="w-full text-left p-6 bg-white border-4 border-slate-800 shadow-[4px_4px_0_rgba(15,23,42,1)] hover:shadow-[8px_8px_0_rgba(59,130,246,1)] hover:-translate-y-1.5 active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(59,130,246,1)] transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="font-bold text-slate-800 text-lg relative z-10 flex items-center gap-3 font-outfit group-hover:text-blue-700 transition-colors">
                  <span className="text-xl group-hover:scale-125 transition-transform duration-300 inline-block">💠</span> Architect (Organizer)
                </div>
                <div className="text-slate-500 font-medium text-xs mt-2 relative z-10 font-outfit group-hover:text-slate-700 transition-colors">Forge events, manage realms, issue credentials.</div>
              </button>
            </div>

            <div className="text-center pt-2 border-t border-slate-300">
              <button onClick={() => { setIsLogin(true); setError(''); }} className="text-green-600 text-xs font-bold hover:text-green-700 transition-colors uppercase tracking-widest mt-4">
                Return to Login
              </button>
            </div>
          </div>
        ) : step === 1 ? (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl text-slate-800 font-vt mb-2 text-shadow-sm">Identity Setup</h1>
              <p className="text-slate-600 text-sm font-outfit font-bold">Configure your digital footprint.</p>
            </div>

            <div className="space-y-4 mb-6 font-outfit">
              <input
                className="w-full bg-white border-4 border-slate-300 rounded-none px-4 py-3 text-slate-800 focus:outline-none focus:border-green-500 transition-all text-sm placeholder-slate-400 font-bold"
                placeholder="Designation (Name)"
                value={form.name}
                onChange={e => { setError(''); setForm({ ...form, name: e.target.value }) }}
              />
              <input
                className="w-full bg-white border-4 border-slate-300 rounded-none px-4 py-3 text-slate-800 focus:outline-none focus:border-green-500 transition-all text-sm placeholder-slate-400 font-bold"
                placeholder="Comm-Link (Email)"
                type="email"
                value={form.email}
                onChange={e => { setError(''); setForm({ ...form, email: e.target.value }) }}
              />
              <input
                className="w-full bg-white border-4 border-slate-300 rounded-none px-4 py-3 text-slate-800 focus:outline-none focus:border-green-500 transition-all text-sm placeholder-slate-400 font-bold"
                placeholder="Security Code (Password)"
                type="password"
                value={form.password}
                onChange={e => { setError(''); setForm({ ...form, password: e.target.value }) }}
              />
              <select
                className="w-full bg-white border-4 border-slate-300 rounded-none px-4 py-3 text-slate-500 focus:outline-none focus:border-green-500 transition-all text-sm font-bold"
                value={form.department}
                onChange={e => { setError(''); setForm({ ...form, department: e.target.value }) }}>
                <option value="" className="bg-white text-slate-400">Select Faction (Department)</option>
                {DEPTS.map(d => <option key={d} className="bg-white text-slate-700">{d}</option>)}
              </select>
            </div>

            <button
              disabled={!step1Valid}
              onClick={() => setStep(2)}
              className="w-full mc-btn py-3 mb-4 font-outfit tracking-wider disabled:opacity-50 disabled:cursor-not-allowed">
              PROCEED →
            </button>
            <div className="text-center">
              <button onClick={() => setStep(0)} className="text-slate-500 text-xs font-bold hover:text-slate-700 uppercase tracking-widest transition-colors">
                ← Abort
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-5 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl text-slate-800 font-vt mb-2 text-shadow-sm">Aura Configuration</h1>
              <p className="text-slate-600 text-sm font-outfit font-bold">Select 2+ domains to sync.</p>
            </div>

            <div className="flex flex-wrap gap-3 mb-8 justify-center font-outfit">
              {TAGS.map(tag => {
                const isSel = selected.includes(tag.id);
                const colorMap = {
                  tech: 'indigo', cultural: 'purple', sports: 'emerald', music: 'pink', career: 'amber', wellness: 'cyan', gaming: 'red'
                };
                const col = colorMap[tag.id] || 'indigo';
                
                return (
                  <button key={tag.id} onClick={() => toggle(tag.id)}
                    className={`px-4 py-2.5 border-2 border-b-4 text-sm font-bold transition-all duration-100 select-none min-h-[44px]
                      ${isSel
                        ? `bg-${col}-100 border-${col}-400 text-${col}-700 shadow-none translate-y-[2px] border-b-2`
                        : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700'}`}>
                    {tag.label}
                  </button>
                )
              })}
            </div>

            {error && (
              <p className="text-red-700 font-bold text-sm mb-6 text-center font-outfit bg-red-100 py-2 border-2 border-red-300">{error}</p>
            )}

            <div className="flex gap-4 font-outfit">
              <button onClick={() => setStep(1)}
                className="mc-btn-secondary px-5 py-3 uppercase tracking-wider flex-1">
                BACK
              </button>
              <button disabled={loading || selected.length < 2} onClick={submit}
                className="mc-btn py-3 px-5 tracking-wider flex-[2] disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'SYNCING...' : 'FINALIZE PROFILE'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}