import { useState, useEffect } from 'react'
import axios from 'axios'
import API from '../config'

const CERT_TYPES = {
  participation: { label: 'Participation', defaultMar: 10 },
  runner_up:     { label: 'Runner Up',     defaultMar: 30 },
  winner:        { label: 'Winner',        defaultMar: 50 },
  special:       { label: 'Special Award', defaultMar: 40 },
}

export default function AdminPanel() {
  const [certs,   setCerts]   = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState({})

  // Use the logged-in organizer's id from localStorage as the admin id
  const adminId = localStorage.getItem('user_id') || 'org-001'

  const load = async () => {
    try {
      const [certsRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/certificates/pending?admin_id=${adminId}`),
        axios.get(`${API}/admin/stats?admin_id=${adminId}`),
      ])
      setCerts(certsRes.data)
      setStats(statsRes.data)
      const init = {}
      certsRes.data.forEach(c => {
        init[c.id] = {
          mar_points: CERT_TYPES[c.cert_type]?.defaultMar || 10,
          note: '',
        }
      })
      setReviews(init)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleReview = async (certId, action) => {
    const r = reviews[certId] || {}
    try {
      await axios.post(`${API}/admin/certificates/review`, {
        admin_id:   adminId,
        cert_id:    certId,
        action,
        mar_points: action === 'approve' ? (r.mar_points || 0) : 0,
        admin_note: r.note || '',
      })
      setCerts(p => p.filter(c => c.id !== certId))
      alert(`Certificate ${action}d ✅`)
    } catch (e) {
      alert(e.response?.data?.detail || 'Action failed')
    }
  }

  const handlePreview = async (cert) => {
    try {
      const res = await axios.get(`${API}/certificates/download/${cert.id}/${cert.user_id}`)
      const win = window.open()
      if (cert.file_name.endsWith('.pdf')) {
        win.document.write(
          `<iframe src="data:application/pdf;base64,${res.data.file_base64}"
            width="100%" height="100%" style="border:none"></iframe>`
        )
      } else {
        win.document.write(
          `<img src="data:image/jpeg;base64,${res.data.file_base64}"
            style="max-width:100%;display:block;margin:auto"/>`
        )
      }
    } catch {
      alert('Preview failed')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">🛡️ Admin Panel</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Students',    value: stats.total_users       },
            { label: 'Events',      value: stats.total_events      },
            { label: 'RSVPs',       value: stats.total_rsvps       },
            { label: 'Pending',     value: stats.pending_certs     },
            { label: 'Approved',    value: stats.approved_certs    },
            { label: 'MAR Awarded', value: stats.total_mar_awarded },
          ].map(s => (
            <div key={s.label}
              className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-indigo-600">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-semibold text-lg mb-4">
        Pending Certificates ({certs.length})
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : certs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-2">✅</div>
          <p>All caught up! No pending certificates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {certs.map(cert => {
            const r        = reviews[cert.id] || {}
            const certType = CERT_TYPES[cert.cert_type]
            return (
              <div key={cert.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{cert.event_name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {cert.issuer} · {cert.event_date} ·{' '}
                      <span className="text-indigo-600">{certType?.label}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Submitted by user {cert.user_id.slice(0, 8)}... on{' '}
                      {cert.submitted_at?.slice(0, 10)}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePreview(cert)}
                    className="text-xs px-3 py-2 rounded-xl
                      bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                    👁️ Preview
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      MAR Points to Award
                    </label>
                    <input type="number" min="0" max="100"
                      className="w-full border border-gray-200 rounded-xl
                        px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={r.mar_points ?? certType?.defaultMar ?? 10}
                      onChange={e => setReviews(prev => ({
                        ...prev,
                        [cert.id]: {...prev[cert.id], mar_points: parseInt(e.target.value) || 0}
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Note to Student (optional)
                    </label>
                    <input
                      className="w-full border border-gray-200 rounded-xl
                        px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="Great work! Keep it up."
                      value={r.note || ''}
                      onChange={e => setReviews(prev => ({
                        ...prev,
                        [cert.id]: {...prev[cert.id], note: e.target.value}
                      }))}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview(cert.id, 'approve')}
                    className="flex-1 bg-green-600 text-white text-sm
                      font-semibold py-2.5 rounded-xl hover:bg-green-700 transition">
                    ✅ Approve — Award {r.mar_points ?? certType?.defaultMar ?? 10} MAR pts
                  </button>
                  <button
                    onClick={() => handleReview(cert.id, 'reject')}
                    className="flex-1 bg-red-50 text-red-600 text-sm
                      font-semibold py-2.5 rounded-xl border border-red-200
                      hover:bg-red-100 transition">
                    ❌ Reject
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
