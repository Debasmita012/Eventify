import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API from '../config'

const CATS      = ['tech','cultural','sports','music','career','wellness','gaming']
const EVT_TYPES = ['campus','hackathon','workshop','competition','conference','cultural','internship','placement']
const RESOURCE_ICONS = ['📄','📊','🎥','💻','🔗','📑','🎤','🖼']

// ── Agenda Builder ────────────────────────────────────────────────────────
function AgendaBuilder({ items, onChange }) {
  const add = () => onChange([...items, { time: '', session: '', speaker: '' }])
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  const update = (i, field, val) => {
    const next = [...items]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-500">Agenda Items</label>
        <button type="button" onClick={add}
          className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition">
          + Add item
        </button>
      </div>
      {items.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4
          text-center text-xs text-gray-400 cursor-pointer hover:border-indigo-300
          hover:text-indigo-400 transition" onClick={add}>
          Click to add agenda items (e.g. 10:00 AM — Keynote)
        </div>
      )}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input value={item.time} onChange={e => update(i, 'time', e.target.value)}
              placeholder="9:00 AM"
              className="w-24 flex-shrink-0 border border-gray-200 rounded-lg px-2 py-2
                text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <input value={item.session} onChange={e => update(i, 'session', e.target.value)}
              placeholder="Session name"
              className="flex-1 border border-gray-200 rounded-lg px-2 py-2
                text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <input value={item.speaker} onChange={e => update(i, 'speaker', e.target.value)}
              placeholder="Speaker (opt)"
              className="w-28 flex-shrink-0 border border-gray-200 rounded-lg px-2 py-2
                text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <button type="button" onClick={() => remove(i)}
              className="text-red-400 hover:text-red-600 text-lg leading-none pt-1.5 flex-shrink-0">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Skills/Tags multi-input ───────────────────────────────────────────────
function TagInput({ label, value, onChange, placeholder }) {
  const [input, setInput] = useState('')
  const add = () => {
    const t = input.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setInput('')
  }
  const remove = (t) => onChange(value.filter(x => x !== t))
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {value.map(t => (
          <span key={t} className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1
            rounded-full flex items-center gap-1 font-medium">
            {t}
            <button onClick={() => remove(t)} className="hover:text-red-500 transition">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs
            focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <button type="button" onClick={add}
          className="text-xs px-3 py-2 bg-indigo-100 text-indigo-700
            rounded-xl font-semibold hover:bg-indigo-200 transition flex-shrink-0">
          Add
        </button>
      </div>
    </div>
  )
}

// ── Winners Builder ───────────────────────────────────────────────────────
function WinnersBuilder({ items, onChange }) {
  const add = () => onChange([...items, { name: '', prize: '' }])
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  const update = (i, field, val) => {
    const next = [...items]; next[i] = { ...next[i], [field]: val }; onChange(next)
  }
  const medals = ['🥇','🥈','🥉','🏅']
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-500">Winners</label>
        <button type="button" onClick={add}
          className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition">
          + Add winner
        </button>
      </div>
      <div className="space-y-2">
        {items.map((w, i) => (
          <div key={i} className="flex gap-2 items-center">
            <span className="text-xl flex-shrink-0">{medals[i] || '🏅'}</span>
            <input value={w.name} onChange={e => update(i, 'name', e.target.value)}
              placeholder="Team / Person name"
              className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs
                focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <input value={w.prize} onChange={e => update(i, 'prize', e.target.value)}
              placeholder="Prize (opt)"
              className="w-32 flex-shrink-0 border border-gray-200 rounded-lg px-2 py-2
                text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <button type="button" onClick={() => remove(i)}
              className="text-red-400 hover:text-red-600 text-lg flex-shrink-0">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Resources Builder ─────────────────────────────────────────────────────
function ResourcesBuilder({ items, onChange }) {
  const add = () => onChange([...items, { label: '', url: '', icon: '📄' }])
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  const update = (i, field, val) => {
    const next = [...items]; next[i] = { ...next[i], [field]: val }; onChange(next)
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-500">Resources / Links</label>
        <button type="button" onClick={add}
          className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition">
          + Add resource
        </button>
      </div>
      <div className="space-y-2">
        {items.map((r, i) => (
          <div key={i} className="flex gap-2 items-center">
            <select value={r.icon} onChange={e => update(i, 'icon', e.target.value)}
              className="w-10 text-center border border-gray-200 rounded-lg py-2
                text-sm focus:outline-none flex-shrink-0">
              {RESOURCE_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
            </select>
            <input value={r.label} onChange={e => update(i, 'label', e.target.value)}
              placeholder="Label (e.g. Workshop PPT)"
              className="w-40 flex-shrink-0 border border-gray-200 rounded-lg px-2 py-2
                text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <input value={r.url} onChange={e => update(i, 'url', e.target.value)}
              placeholder="https://..."
              className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs
                focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <button type="button" onClick={() => remove(i)}
              className="text-red-400 hover:text-red-600 text-lg flex-shrink-0">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Section toggle wrapper ────────────────────────────────────────────────
function Section({ title, icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3
          bg-gray-50 hover:bg-gray-100 transition text-left">
        <span className="font-medium text-sm text-gray-700">{icon} {title}</span>
        <span className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="px-4 py-4 space-y-3">{children}</div>}
    </div>
  )
}

// ── Live Controls panel ───────────────────────────────────────────────────
function LiveControls({ event, onDone }) {
  const [live, setLive] = useState({
    phase:           event.phase || 'before',
    current_session: event.current_session || '',
    next_session:    event.next_session    || '',
    announcement:    event.announcement   || '',
    poll_question:   event.poll_question  || '',
    poll_options:    (event.poll_options  || []).join('\n'),
    live_count:      event.live_count     || 0,
  })
  const [after, setAfter] = useState({
    winners:     event.winners    || [],
    resources:   event.resources  || [],
    recap:       event.recap      || '',
    photos:      (event.photos || []).join('\n'),
    final_count: event.final_count || 0,
  })
  const [tab,     setTab]     = useState('live')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState('')

  const saveLive = async () => {
    setSaving(true)
    try {
      await axios.patch(`${API}/events/${event.id}/live`, {
        organizer_id:    localStorage.getItem('user_id'),
        phase:           live.phase,
        current_session: live.current_session,
        next_session:    live.next_session,
        announcement:    live.announcement,
        poll_question:   live.poll_question,
        poll_options:    live.poll_options.split('\n').map(s => s.trim()).filter(Boolean),
        live_count:      parseInt(live.live_count) || 0,
      })
      setSaved('Live state updated ✅')
      setTimeout(() => { setSaved(''); onDone() }, 1800)
    } catch { alert('Failed to update live state') }
    setSaving(false)
  }

  const saveAfter = async () => {
    setSaving(true)
    try {
      await axios.patch(`${API}/events/${event.id}/after`, {
        organizer_id: localStorage.getItem('user_id'),
        winners:      after.winners,
        resources:    after.resources,
        recap:        after.recap,
        photos:       after.photos.split('\n').map(s => s.trim()).filter(Boolean),
        final_count:  parseInt(after.final_count) || 0,
      })
      setSaved('After-event content published ✅')
      setTimeout(() => { setSaved(''); onDone() }, 1800)
    } catch { alert('Failed to publish after-event content') }
    setSaving(false)
  }

  return (
    <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{event.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{event.venue} · Event #{event.id}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full
          ${event.phase === 'live' ? 'bg-red-100 text-red-700'
          : event.phase === 'after' ? 'bg-gray-100 text-gray-600'
          : 'bg-green-100 text-green-700'}`}>
          {event.phase === 'live' ? '🔴 Live' : event.phase === 'after' ? '✅ Ended' : '⏳ Before'}
        </span>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-gray-100">
        {[
          { id: 'live',  label: '📡 Live Controls' },
          { id: 'after', label: '🏆 After Event' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-xs font-semibold transition
              ${tab === t.id ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 py-4 space-y-4">
        {saved && (
          <div className="bg-green-50 text-green-700 border border-green-200 rounded-xl
            px-3 py-2 text-xs font-semibold text-center">
            {saved}
          </div>
        )}

        {tab === 'live' && (
          <>
            {/* Phase switcher */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Event Phase</label>
              <div className="flex gap-2">
                {['before','live','after'].map(p => (
                  <button key={p} type="button"
                    onClick={() => setLive(l => ({ ...l, phase: p }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition
                      ${live.phase === p
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                    {p === 'before' ? '⏳ Before' : p === 'live' ? '🔴 Live' : '✅ After'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Current Session</label>
                <input value={live.current_session}
                  onChange={e => setLive(l => ({ ...l, current_session: e.target.value }))}
                  placeholder="ML Hands-On Lab"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs
                    focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Next Session</label>
                <input value={live.next_session}
                  onChange={e => setLive(l => ({ ...l, next_session: e.target.value }))}
                  placeholder="Career Panel"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs
                    focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">📢 Announcement</label>
              <input value={live.announcement}
                onChange={e => setLive(l => ({ ...l, announcement: e.target.value }))}
                placeholder="Lunch break in Room 101..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs
                  focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">📊 Live Poll Question</label>
              <input value={live.poll_question}
                onChange={e => setLive(l => ({ ...l, poll_question: e.target.value }))}
                placeholder="Which topic interests you most?"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-2" />
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Poll Options (one per line)
              </label>
              <textarea value={live.poll_options}
                onChange={e => setLive(l => ({ ...l, poll_options: e.target.value }))}
                placeholder={"AI / ML\nWeb Development\nCybersecurity"}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 h-20 resize-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">👥 Live Attendance Count</label>
              <input type="number" value={live.live_count}
                onChange={e => setLive(l => ({ ...l, live_count: e.target.value }))}
                className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-xs
                  focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>

            <button onClick={saveLive} disabled={saving}
              className="w-full bg-red-600 text-white rounded-xl py-2.5 text-xs
                font-bold hover:bg-red-700 transition disabled:opacity-50">
              {saving ? 'Saving...' : '🔴 Push Live Update'}
            </button>
          </>
        )}

        {tab === 'after' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Final Attendance Count
              </label>
              <input type="number" value={after.final_count}
                onChange={e => setAfter(a => ({ ...a, final_count: e.target.value }))}
                placeholder="432"
                className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-xs
                  focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>

            <WinnersBuilder items={after.winners}
              onChange={v => setAfter(a => ({ ...a, winners: v }))} />

            <ResourcesBuilder items={after.resources}
              onChange={v => setAfter(a => ({ ...a, resources: v }))} />

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">📝 Recap</label>
              <textarea value={after.recap}
                onChange={e => setAfter(a => ({ ...a, recap: e.target.value }))}
                placeholder="Write a summary of what happened..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 h-20 resize-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                📸 Photo URLs (one per line)
              </label>
              <textarea value={after.photos}
                onChange={e => setAfter(a => ({ ...a, photos: e.target.value }))}
                placeholder={"https://i.imgur.com/photo1.jpg\nhttps://i.imgur.com/photo2.jpg"}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 h-20 resize-none" />
            </div>

            <button onClick={saveAfter} disabled={saving}
              className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-xs
                font-bold hover:bg-indigo-700 transition disabled:opacity-50">
              {saving ? 'Publishing...' : '🏆 Publish After-Event Content'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main OrganizerPortal ──────────────────────────────────────────────────
export default function OrganizerPortal() {
  const [events,     setEvents]     = useState([])
  const [success,    setSuccess]    = useState('')
  const [loading,    setLoading]    = useState(false)
  const [activeCtrl, setActiveCtrl] = useState(null)  // event id for live controls
  const navigate = useNavigate()
  const userId = localStorage.getItem('user_id')

  const emptyForm = {
    title: '', description: '', category: 'tech', venue: '',
    datetime: '', why_it_matters: '',
    // Rich fields
    event_type: 'campus', eligibility: '', required_skills: [],
    expected_audience: '', prizes: '', registration_link: '',
    agenda: [], tags: [],
  }
  const [form, setForm] = useState(emptyForm)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const loadEvents = async () => {
    try {
      // Load events by this organizer
      const res = await axios.get(`${API}/events/organizer/${userId}`)
      setEvents(res.data)
    } catch {
      // Fallback: load all events
      try {
        const res = await axios.get(`${API}/events`)
        setEvents(res.data.filter(e => e.organizer_id === userId))
      } catch {}
    }
  }

  useEffect(() => { loadEvents() }, [])

  const submit = async () => {
    if (!form.title || !form.description || !form.venue || !form.datetime)
      return alert('Please fill all required fields')
    setLoading(true)
    try {
      await axios.post(`${API}/events`, {
        ...form,
        organizer_id:      userId,
        expected_audience: parseInt(form.expected_audience) || 0,
      })
      setSuccess('Event published successfully! ✅')
      setForm(emptyForm)
      loadEvents()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      alert('Failed to create event — is the backend running?')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📋 Organizer Portal</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* ── Create Event Form ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-5">Create New Event</h2>

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700
                px-4 py-3 rounded-xl text-sm font-medium">
                {success}
              </div>
            )}

            <div className="space-y-4">
              {/* ── Basic Info (always open) ── */}
              <Section title="Basic Info" icon="📌" defaultOpen>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Event title *</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)}
                    placeholder="e.g. Tech Talk: AI in 2025"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description *</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder="What's happening, who should attend..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-indigo-400 h-24 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Category *</label>
                    <select value={form.category} onChange={e => set('category', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                        focus:outline-none focus:ring-2 focus:ring-indigo-400">
                      {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Event Type</label>
                    <select value={form.event_type} onChange={e => set('event_type', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                        focus:outline-none focus:ring-2 focus:ring-indigo-400">
                      {EVT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Venue *</label>
                  <input value={form.venue} onChange={e => set('venue', e.target.value)}
                    placeholder="e.g. Main Auditorium"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date & Time *</label>
                  <input type="datetime-local" value={form.datetime}
                    onChange={e => set('datetime', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Why it matters</label>
                  <input value={form.why_it_matters} onChange={e => set('why_it_matters', e.target.value)}
                    placeholder="e.g. Resume boost + MAR points"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </Section>

              {/* ── Details ── */}
              <Section title="Details & Eligibility" icon="📋">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Eligibility</label>
                  <input value={form.eligibility} onChange={e => set('eligibility', e.target.value)}
                    placeholder="e.g. Open to all / 2nd year+ / CS students only"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Expected Audience</label>
                    <input type="number" value={form.expected_audience}
                      onChange={e => set('expected_audience', e.target.value)}
                      placeholder="200"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                        focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Registration Link</label>
                    <input value={form.registration_link}
                      onChange={e => set('registration_link', e.target.value)}
                      placeholder="https://forms.google.com/..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                        focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Prizes</label>
                  <input value={form.prizes} onChange={e => set('prizes', e.target.value)}
                    placeholder="1st: ₹10,000 | 2nd: ₹5,000 | 3rd: ₹2,000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <TagInput label="Required Skills" value={form.required_skills}
                  onChange={v => set('required_skills', v)}
                  placeholder="Python, ML, React… press Enter" />
                <TagInput label="Tags" value={form.tags}
                  onChange={v => set('tags', v)}
                  placeholder="AI, Google, Hackathon… press Enter" />
              </Section>

              {/* ── Agenda ── */}
              <Section title="Agenda Builder" icon="🗓">
                <AgendaBuilder items={form.agenda} onChange={v => set('agenda', v)} />
              </Section>

              <button onClick={submit} disabled={loading}
                className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold
                  hover:bg-indigo-700 transition disabled:opacity-50">
                {loading ? 'Publishing...' : '🚀 Publish Event'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Events List + Live Controls ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-4">Your Events ({events.length})</h2>
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No events yet — create your first one!
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {events.map(e => (
                  <div key={e.id}
                    className="bg-gray-50 border border-gray-100 rounded-xl p-3
                      flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="font-medium text-sm text-gray-900 truncate">{e.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {e.venue} · {e.rsvp_count} RSVPs ·
                        <span className={`ml-1 font-semibold
                          ${e.phase === 'live' ? 'text-red-600' : e.phase === 'after' ? 'text-gray-500' : 'text-green-600'}`}>
                          {e.phase === 'live' ? '🔴 Live' : e.phase === 'after' ? '✅ Ended' : '⏳ Before'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => navigate(`/analytics/${e.id}`)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-100
                          text-indigo-700 font-semibold hover:bg-indigo-200 transition"
                        title="Event Deep Analytics">
                        📊
                      </button>
                      <button onClick={() => navigate(`/operations/${e.id}`)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-red-100
                          text-red-700 font-semibold hover:bg-red-200 transition"
                        title="Live Operations Dashboard">
                        🚦
                      </button>
                      <button
                        onClick={() => setActiveCtrl(activeCtrl === e.id ? null : e.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition
                          ${activeCtrl === e.id
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        title="Quick Phase Switcher & Live Controls">
                        {activeCtrl === e.id ? '✕' : '⚙️'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Controls panel — shown for selected event */}
          {activeCtrl && (() => {
            const ev = events.find(e => e.id === activeCtrl)
            return ev ? (
              <LiveControls key={activeCtrl} event={ev} onDone={() => { loadEvents() }} />
            ) : null
          })()}
        </div>
      </div>
    </div>
  )
}
