import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import API from '../config'

const CERT_TYPES = [
  { id: 'participation', label: 'Participation', mar: 10, color: 'bg-blue-100 text-blue-700' },
  { id: 'runner_up',     label: 'Runner Up',     mar: 30, color: 'bg-purple-100 text-purple-700' },
  { id: 'winner',        label: 'Winner',        mar: 50, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'special',       label: 'Special Award', mar: 40, color: 'bg-pink-100 text-pink-700' },
]

const STATUS_STYLES = {
  pending:  { label: '⏳ Pending Review', cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '✅ Approved',       cls: 'bg-green-100 text-green-700'  },
  rejected: { label: '❌ Rejected',       cls: 'bg-red-100 text-red-700'      },
}

export default function CertificateVault() {
  const [certs,      setCerts]      = useState([])
  const [stats,      setStats]      = useState(null)
  const [showForm,   setShowForm]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState('')
  const [loading,    setLoading]    = useState(true)
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    event_name: '',
    issuer:     '',
    event_date: '',
    cert_type:  'participation',
    file:       null,
    fileName:   '',
  })

  const userId = localStorage.getItem('user_id')

  const loadCerts = async () => {
    try {
      const res = await axios.get(`${API}/certificates/user/${userId}`)
      setCerts(res.data.certificates || [])
      setStats(res.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadCerts() }, [])

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      alert('File too large. Max 4MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      setForm(f => ({ ...f, file: base64, fileName: file.name }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!form.event_name || !form.issuer || !form.event_date || !form.file) {
      alert('Please fill all fields and upload a file')
      return
    }
    setSubmitting(true)
    try {
      await axios.post(`${API}/certificates/upload`, {
        user_id:     userId,
        event_name:  form.event_name,
        issuer:      form.issuer,
        event_date:  form.event_date,
        cert_type:   form.cert_type,
        file_base64: form.file,
        file_name:   form.fileName,
      })
      setSuccess('Certificate submitted! Admin will review within 48 hours ✅')
      setForm({ event_name:'', issuer:'', event_date:'', cert_type:'participation', file:null, fileName:'' })
      setShowForm(false)
      loadCerts()
      setTimeout(() => setSuccess(''), 5000)
    } catch (e) {
      alert(e.response?.data?.detail || 'Upload failed')
    }
    setSubmitting(false)
  }

  const handleDownload = async (cert) => {
    try {
      const res = await axios.get(`${API}/certificates/download/${cert.id}/${userId}`)
      const link = document.createElement('a')
      link.href  = `data:application/octet-stream;base64,${res.data.file_base64}`
      link.download = res.data.file_name
      link.click()
    } catch {
      alert('Download failed')
    }
  }

  const selectedType = CERT_TYPES.find(t => t.id === form.cert_type)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏅 Certificate Vault</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload certificates from external events to earn MAR points
          </p>
        </div>
        <button onClick={() => setShowForm(f => !f)}
          className="bg-indigo-600 text-white px-4 py-2.5
            rounded-xl text-sm font-semibold hover:bg-indigo-700
            transition flex items-center gap-2">
          {showForm ? '✕ Cancel' : '+ Upload Certificate'}
        </button>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700
          rounded-xl px-4 py-3 text-sm mb-4">
          {success}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Uploaded',    value: certs.length,            icon: '📋' },
            { label: 'MAR Points Earned', value: stats.total_mar_points,  icon: '⭐' },
            { label: 'Pending Review',    value: stats.pending_count,     icon: '⏳' },
          ].map(s => (
            <div key={s.label}
              className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-indigo-600">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-100 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-5">Upload New Certificate</h2>
          <div className="space-y-4">

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Event / Competition Name *
              </label>
              <input
                className="w-full border border-gray-200 rounded-xl
                  px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="e.g. Smart India Hackathon 2025"
                value={form.event_name}
                onChange={e => setForm(f => ({...f, event_name: e.target.value}))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Issuing Organisation *
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl
                    px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="e.g. AICTE / Google / MLH"
                  value={form.issuer}
                  onChange={e => setForm(f => ({...f, issuer: e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Event Date *
                </label>
                <input type="date"
                  className="w-full border border-gray-200 rounded-xl
                    px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.event_date}
                  onChange={e => setForm(f => ({...f, event_date: e.target.value}))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Certificate Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CERT_TYPES.map(t => (
                  <button key={t.id}
                    onClick={() => setForm(f => ({...f, cert_type: t.id}))}
                    className={`px-3 py-2.5 rounded-xl border-2
                      text-xs font-medium text-center transition-all
                      ${form.cert_type === t.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                    {t.label}
                    <div className="text-xs text-gray-400 mt-0.5">~{t.mar} MAR pts</div>
                  </button>
                ))}
              </div>
              {selectedType && (
                <p className="text-xs text-indigo-600 mt-2">
                  ✨ Approx. {selectedType.mar} MAR points on approval
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Certificate File * (JPG, PNG, PDF — max 4MB)
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6
                  text-center cursor-pointer transition-all
                  ${form.file
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'}`}>
                <input ref={fileRef} type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFile}
                  className="hidden" />
                {form.file ? (
                  <div>
                    <div className="text-2xl mb-1">✅</div>
                    <div className="text-sm font-medium text-green-700">{form.fileName}</div>
                    <div className="text-xs text-green-600 mt-1">Click to change</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl mb-1">📎</div>
                    <div className="text-sm text-gray-500">Click to upload certificate</div>
                    <div className="text-xs text-gray-400 mt-1">JPG, PNG or PDF, max 4MB</div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-indigo-600 text-white rounded-xl
                py-3 font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
              {submitting ? 'Submitting...' : '🚀 Submit for Review'}
            </button>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 text-sm text-blue-800">
        <strong>How it works:</strong> Upload your certificate → Admin reviews within 48 hours →
        MAR points added to your profile → Your 6-month record is always available here for college submissions.
      </div>

      {/* Certificate list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : certs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-2">🏅</div>
          <p className="text-sm">No certificates yet.</p>
          <p className="text-xs mt-1">Upload your first certificate to start earning MAR points!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {certs.map(cert => {
            const status   = STATUS_STYLES[cert.status] || STATUS_STYLES.pending
            const certType = CERT_TYPES.find(t => t.id === cert.cert_type)
            return (
              <div key={cert.id}
                className="bg-white rounded-2xl border border-gray-100
                  p-4 flex items-center gap-4 shadow-sm">

                <div className="w-12 h-12 bg-indigo-100 rounded-xl
                  flex items-center justify-center text-2xl flex-shrink-0">
                  🏅
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">
                    {cert.event_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {cert.issuer} · {cert.event_date}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {certType && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${certType.color}`}>
                        {certType.label}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>
                      {status.label}
                    </span>
                    {cert.status === 'approved' && cert.mar_points > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                        +{cert.mar_points} MAR pts
                      </span>
                    )}
                  </div>
                  {cert.admin_note && (
                    <p className="text-xs text-gray-500 mt-1 italic">Note: {cert.admin_note}</p>
                  )}
                </div>

                <button
                  onClick={() => handleDownload(cert)}
                  className="flex-shrink-0 text-xs px-3 py-2
                    rounded-xl border border-gray-200 text-gray-600
                    hover:bg-gray-50 transition">
                  ⬇️
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
