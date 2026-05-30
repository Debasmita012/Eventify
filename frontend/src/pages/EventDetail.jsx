import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import API from '../config'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import QRCode from 'react-qr-code'

// ── Constants ─────────────────────────────────────────────────────────────
const CAT_COLORS = {
  tech:     'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  cultural: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  sports:   'bg-green-500/20 text-green-300 border border-green-500/30',
  music:    'bg-pink-500/20 text-pink-300 border border-pink-500/30',
  career:   'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  wellness: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
  gaming:   'bg-red-500/20 text-red-300 border border-red-500/30',
}

const ET_ICONS = {
  campus:      '🏫', hackathon:  '💻', workshop:  '🔧',
  competition: '🏆', conference: '🎤', cultural:  '🎭',
  internship:  '💼', placement:  '👔',
}

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { width, height } = useWindowSize()

  const userId = localStorage.getItem('user_id')
  const userRole = localStorage.getItem('user_role') || 'student'
  const userName = localStorage.getItem('user_name') || 'Student Participant'

  // Global Event States
  const [event, setEvent] = useState(null)
  const [rsvpd, setRsvpd] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showConfetti, setShowConfetti] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [viewMode, setViewMode] = useState('public') // 'public' | 'organizer'

  // Sub-modules state
  const [announcements, setAnnouncements] = useState([])
  const [newAnnouncement, setNewAnnouncement] = useState('')
  
  // Help desk state
  const [helpTickets, setHelpTickets] = useState([])
  const [helpCat, setHelpCat] = useState('query')
  const [helpMsg, setHelpMsg] = useState('')
  const [helpPriority, setHelpPriority] = useState('medium')
  const [submittingHelp, setSubmittingHelp] = useState(false)

  // Operations counters (Food & Parking)
  const [opsData, setOpsData] = useState([])
  
  // Quizzes state
  const [quizzes, setQuizzes] = useState([])
  const [quizSubmissions, setQuizSubmissions] = useState([])
  const [quizLeaderboard, setQuizLeaderboard] = useState([])
  const [selectedQuizOption, setSelectedQuizOption] = useState(null)
  const [activeQuizId, setActiveQuizId] = useState(null)
  
  // Food Coupons / Tokens
  const [myCoupons, setMyCoupons] = useState([])
  const [activeMealCoupon, setActiveMealCoupon] = useState(null)
  const [verifyCouponCode, setVerifyCouponCode] = useState('')
  const [verifyingMeal, setVerifyingMeal] = useState(false)

  // Photo uploader state
  const [photoGallery, setPhotoGallery] = useState([])
  const [pendingPhotos, setPendingPhotos] = useState([])
  const [photoBase64, setPhotoBase64] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Attendee Networking Matches
  const [networkingMatches, setNetworkingMatches] = useState([])
  const [attendeesList, setAttendeesList] = useState([])

  // AI assistant drawer state
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [aiChatHistory, setAiChatHistory] = useState([
    { role: 'assistant', content: 'Hi there! 🤖 I am your custom Event AI Assistant. Ask me anything about rules, prize pools, food court menus, schedule, or venue, and I will answer immediately!' }
  ])
  const [aiMessage, setAiMessage] = useState('')
  const chatBottomRef = useRef(null)

  // Rating & feedback
  const [feedbackList, setFeedbackList] = useState([])
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  // FAQ Accordion expanded state tracker (matches Screenshot 3 style)
  const [expandedFAQ, setExpandedFAQ] = useState({})

  // Edit Event state (Organizer)
  const [editDesc, setEditDesc] = useState('')
  const [editRules, setEditRules] = useState('')
  const [editWhyItMatters, setEditWhyItMatters] = useState('')
  const [editPrizes, setEditPrizes] = useState('')
  const [editEligibility, setEditEligibility] = useState('')
  const [editRegistrationLink, setEditRegistrationLink] = useState('')
  const [editTags, setEditTags] = useState('')

  // Quiz / Poll creators
  const [newQuizQuestion, setNewQuizQuestion] = useState('')
  const [newQuizOptA, setNewQuizOptA] = useState('')
  const [newQuizOptB, setNewQuizOptB] = useState('')
  const [newQuizOptC, setNewQuizOptC] = useState('')
  const [newQuizOptD, setNewQuizOptD] = useState('')
  const [newQuizCorrect, setNewQuizCorrect] = useState('A')
  const [newQuizPoints, setNewQuizPoints] = useState(50)

  const [newPollQuestion, setNewPollQuestion] = useState('')
  const [newPollOpt1, setNewPollOpt1] = useState('')
  const [newPollOpt2, setNewPollOpt2] = useState('')
  const [newPollOpt3, setNewPollOpt3] = useState('')
  
  // Interactive SVG Map Active Room Zone Highlight
  const [selectedMapZone, setSelectedMapZone] = useState('Main Stage')

  // Live countdown
  const [countdownString, setCountdownString] = useState('')

  // ── Loaders ──────────────────────────────────────────────────────────────
  const loadEventData = async () => {
    try {
      const [evRes, rsvpRes, bookRes] = await Promise.all([
        axios.get(`${API}/events/${id}`),
        axios.get(`${API}/rsvps/${userId}`),
        axios.get(`${API}/bookmarks/${userId}`),
      ])
      const ev = evRes.data
      setEvent(ev)
      setCount(ev.rsvp_count)
      setRsvpd(rsvpRes.data.some(e => e.id === parseInt(id)))
      setBookmarked(bookRes.data.some(e => e.id === parseInt(id)))

      // Populate editors
      setEditDesc(ev.description || '')
      setEditRules(ev.rules || '')
      setEditWhyItMatters(ev.why_it_matters || '')
      setEditPrizes(ev.prizes || '')
      setEditEligibility(ev.eligibility || '')
      setEditRegistrationLink(ev.registration_link || '')
      setEditTags(ev.tags ? ev.tags.join(', ') : '')

      // Sync custom states
      if (ev.announcement) {
        setAnnouncements([{ message: ev.announcement, category: 'pin', id: 'pinned' }])
      }
    } catch (e) {
      console.error(e)
      navigate('/feed')
    }
  }

  const loadSubmodulesData = async () => {
    try {
      // Operations status (Food & Parking)
      const opsRes = await axios.get(`${API}/events/${id}/operations`)
      setOpsData(opsRes.data || [])

      // Help tickets
      const ticketsRes = await axios.get(`${API}/events/${id}/help`)
      setHelpTickets(ticketsRes.data || [])

      // Quizzes
      const quizRes = await axios.get(`${API}/events/${id}/quizzes`)
      setQuizzes(quizRes.data || [])
      if (quizRes.data && quizRes.data.length > 0) {
        // Set first quiz as active in the "all-in-one" panel
        setActiveQuizId(quizRes.data[0].id)
      }

      // Quiz Leaderboard
      const qLboardRes = await axios.get(`${API}/events/${id}/quiz-leaderboard`)
      setQuizLeaderboard(qLboardRes.data || [])

      // Food Coupons for this student
      const couponRes = await axios.get(`${API}/events/${id}/meals/${userId}`)
      setMyCoupons(couponRes.data || [])

      // Approved Photos
      const photosRes = await axios.get(`${API}/events/${id}/photos`)
      setPhotoGallery(photosRes.data || [])

      // Feedback
      const feedbackRes = await axios.get(`${API}/events/${id}/feedback`)
      setFeedbackList(feedbackRes.data.comments || [])
      const mine = feedbackRes.data.comments.some(f => f.user_id === userId)
      if (mine) setFeedbackSubmitted(true)

      // Networking matches
      const netRes = await axios.get(`${API}/users/${userId}/networking-matches`)
      setNetworkingMatches(netRes.data || [])

      // Total attendees list
      const attsRes = await axios.get(`${API}/events/${id}/attendees`)
      setAttendeesList(attsRes.data || [])

      // Pending photos if organizer
      if (userRole === 'organizer' || userRole === 'admin') {
        const pendingRes = await axios.get(`${API}/events/${id}/photos/pending`)
        setPendingPhotos(pendingRes.data || [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadEventData()
    loadSubmodulesData()
    // Poll updates every 6 seconds for real-time announcements/ops
    const interval = setInterval(() => {
      loadEventData()
      loadSubmodulesData()
    }, 6000)
    return () => clearInterval(interval)
  }, [id])

  // Countdown timer clock
  useEffect(() => {
    if (!event) return
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const dest = new Date(event.datetime).getTime()
      const diff = dest - now

      if (diff < 0) {
        setCountdownString('Event Started / Live 📡')
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const secs = Math.floor((diff % (1000 * 60)) / 1000)
        setCountdownString(`${days}d ${hours}h ${mins}m ${secs}s`)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [event])

  // Auto-scroll AI Assist chat window
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [aiChatHistory, showAIAssistant])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRSVP = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API}/rsvp`, { user_id: userId, event_id: parseInt(id) })
      const added = res.data.action === 'added'
      setRsvpd(added)
      if (added) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 5000)
      }
      setCount(c => added ? c + 1 : c - 1)
      if (res.data.conflict) {
        alert(`⚠️ Schedule clash detected!\nThis overlaps with your RSVP: "${res.data.conflict}"`)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleBookmark = async () => {
    try {
      const res = await axios.post(`${API}/bookmark`, { user_id: userId, event_id: parseInt(id) })
      setBookmarked(res.data.action === 'added')
    } catch (e) {
      console.error(e)
    }
  }

  // Attendance check-in zone logger
  const [selectedZone, setSelectedZone] = useState('Main Stage')
  const [checkedInZone, setCheckedInZone] = useState(null)
  const [checkingIn, setCheckingIn] = useState(false)

  const handleCheckIn = async () => {
    setCheckingIn(true)
    try {
      await axios.post(`${API}/events/${id}/checkin`, {
        user_id: userId,
        zone: selectedZone
      })
      setCheckedInZone(selectedZone)
      alert(`Checked in successfully to room zone: ${selectedZone}! +50 XP 🏢`)
      loadSubmodulesData()
    } catch (e) {
      console.error(e)
      alert('Check-in failed. Please verify again.')
    }
    setCheckingIn(false)
  }

  // Claim Food Coupon
  const handleClaimMeal = async (mealName) => {
    try {
      const res = await axios.post(`${API}/events/${id}/claim-meal`, {
        user_id: userId,
        meal: mealName
      })
      alert(res.data.message)
      loadSubmodulesData()
    } catch (e) {
      if (e.response?.data?.detail) {
        alert(`⚠️ ${e.response.data.detail}`)
      } else {
        alert('Failed to claim meal token.')
      }
    }
  }

  // Verify Food Coupon (Organizer)
  const handleVerifyMealCoupon = async (e) => {
    e.preventDefault()
    if (!verifyCouponCode.trim()) return
    setVerifyingMeal(true)
    try {
      const res = await axios.post(`${API}/events/${id}/verify-meal`, {
        organizer_id: userId,
        coupon_id: verifyCouponCode.trim()
      })
      alert(`✅ Verified! ${res.data.message}`)
      setVerifyCouponCode('')
      loadSubmodulesData()
    } catch (e) {
      if (e.response?.data?.detail) {
        alert(`⚠️ Verification Error: ${e.response.data.detail}`)
      } else {
        alert('Failed to verify coupon code.')
      }
    }
    setVerifyingMeal(false)
  }

  // Quiz Attempt Answer submit
  const handleAttemptQuiz = async (quizId) => {
    if (!selectedQuizOption) {
      alert('Please select an option first!')
      return
    }
    try {
      const res = await axios.post(`${API}/events/${id}/quiz-submit`, {
        user_id: userId,
        quiz_id: quizId,
        selected_option: selectedQuizOption
      })
      if (res.data.correct) {
        alert('🎉 Correct answer! XP added to Leaderboard!')
      } else {
        alert('❌ Incorrect answer. Correct option was ' + res.data.correct_option)
      }
      setQuizSubmissions(prev => [...prev, quizId])
      setSelectedQuizOption(null)
      loadSubmodulesData()
    } catch (e) {
      console.error(e)
      alert('You already submitted this quiz!')
    }
  }

  // Help support ticket submission
  const handleSubmitHelpTicket = async (e) => {
    e.preventDefault()
    if (!helpMsg.trim()) return
    setSubmittingHelp(true)
    try {
      await axios.post(`${API}/events/${id}/help`, {
        user_id: userId,
        category: helpCat,
        message: `${helpPriority.toUpperCase()} PRIORITY: ${helpMsg.trim()}`
      })
      setHelpMsg('')
      alert('Support alert ticket submitted successfully! Organizer help desk is reviewing 🆘')
      loadSubmodulesData()
    } catch (e) {
      console.error(e)
      alert('Submission failed.')
    }
    setSubmittingHelp(false)
  }

  // Resolve Help ticket (Organizer)
  const handleResolveTicket = async (reqId) => {
    try {
      await axios.patch(`${API}/events/${id}/help/${reqId}`)
      alert('Ticket marked as resolved! ✅')
      loadSubmodulesData()
    } catch (e) {
      console.error(e)
    }
  }

  // Photo Uploader base64 reader
  const handlePhotoFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoBase64(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadPhoto = async () => {
    if (!photoBase64) {
      alert('Please choose a photo first!')
      return
    }
    setUploadingPhoto(true)
    try {
      await axios.post(`${API}/events/${id}/photos/upload`, {
        user_id: userId,
        photo_base64: photoBase64,
        name: userName
      })
      setPhotoBase64('')
      alert('Photo uploaded! It will display in gallery once approved by organizer 📸')
      loadSubmodulesData()
    } catch (e) {
      console.error(e)
      alert('Failed to upload photo.')
    }
    setUploadingPhoto(false)
  }

  // Photo moderation (Organizer)
  const handleModeratePhoto = async (photoId, approved) => {
    try {
      const res = await axios.post(`${API}/events/${id}/photos/${photoId}/review`, {
        organizer_id: userId,
        approved
      })
      alert(res.data.message)
      loadSubmodulesData()
    } catch (e) {
      console.error(e)
    }
  }

  // Pinned or Pushed live announcements (Organizer)
  const handlePushAnnouncement = async () => {
    if (!newAnnouncement.trim()) return
    try {
      await axios.patch(`${API}/events/${id}/live`, {
        organizer_id: userId,
        phase: event.phase || 'live',
        announcement: newAnnouncement.trim(),
        current_session: event.current_session || '',
        next_session: event.next_session || ''
      })
      setNewAnnouncement('')
      alert('Live announcement broadcasted and pinned successfully! 📢')
      loadEventData()
    } catch (e) {
      console.error(e)
      alert('Failed to broadcast.')
    }
  }

  // Edit Event details submit (Organizer)
  const handleUpdateEventDetails = async (e) => {
    e.preventDefault()
    try {
      await axios.patch(`${API}/events/${id}/details`, {
        organizer_id: userId,
        description: editDesc,
        rules: editRules,
        why_it_matters: editWhyItMatters,
        prizes: editPrizes,
        eligibility: editEligibility,
        registration_link: editRegistrationLink,
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean)
      })
      alert('Event details updated successfully! 🛠️')
      loadEventData()
    } catch (e) {
      console.error(e)
      alert('Failed to update details.')
    }
  }

  // Create Quiz (Organizer)
  const handleCreateQuiz = async (e) => {
    e.preventDefault()
    if (!newQuizQuestion.trim() || !newQuizOptA.trim() || !newQuizOptB.trim()) {
      alert('Please fill quiz details!')
      return
    }
    try {
      await axios.post(`${API}/events/${id}/quiz`, {
        organizer_id: userId,
        question: newQuizQuestion.trim(),
        options: [newQuizOptA.trim(), newQuizOptB.trim(), newQuizOptC.trim(), newQuizOptD.trim()].filter(Boolean),
        correct_option: newQuizCorrect,
        points: parseInt(newQuizPoints) || 50
      })
      setNewQuizQuestion('')
      setNewQuizOptA('')
      setNewQuizOptB('')
      setNewQuizOptC('')
      setNewQuizOptD('')
      alert('Gamified Quiz added successfully! 📝')
      loadSubmodulesData()
    } catch (e) {
      console.error(e)
      alert('Failed to add quiz.')
    }
  }

  // Launch live poll (Organizer)
  const handleCreatePoll = async (e) => {
    e.preventDefault()
    if (!newPollQuestion.trim() || !newPollOpt1.trim() || !newPollOpt2.trim()) {
      alert('Please fill poll options!')
      return
    }
    try {
      await axios.patch(`${API}/events/${id}/live`, {
        organizer_id: userId,
        phase: event.phase || 'live',
        poll_question: newPollQuestion.trim(),
        poll_options: [newPollOpt1.trim(), newPollOpt2.trim(), newPollOpt3.trim()].filter(Boolean)
      })
      setNewPollQuestion('')
      setNewPollOpt1('')
      setNewPollOpt2('')
      setNewPollOpt3('')
      alert('Live Poll launched successfully! Check live results in Engage tab 📊')
      loadEventData()
    } catch (e) {
      console.error(e)
      alert('Failed to launch poll.')
    }
  }

  // Submit Feedback Rating
  const handleSubmitFeedback = async () => {
    if (!myRating) {
      alert('Please choose a star rating first!')
      return
    }
    setSubmittingFeedback(true)
    try {
      await axios.post(`${API}/events/${id}/feedback`, {
        user_id: userId,
        rating: myRating,
        comment: myComment.trim()
      })
      setFeedbackSubmitted(true)
      alert('Feedback rating submitted! Thank you! 💚')
      loadSubmodulesData()
    } catch (e) {
      console.error(e)
      if (e.response?.status === 400) setFeedbackSubmitted(true)
      else alert('Failed to submit feedback.')
    }
    setSubmittingFeedback(false)
  }

  // Toggle Completion Phase (Organizer override)
  const handleToggleCompletion = async () => {
    try {
      await axios.patch(`${API}/events/${id}/after`, {
        organizer_id: userId,
        winners: event.winners || [],
        resources: event.resources || [],
        recap: event.recap || 'Event successfully completed. Certificates unlocked!',
        photos: event.photos || [],
        final_count: attendeesList.length
      })
      alert('Event successfully completed! Participant certificates unlocked! 🎓')
      loadEventData()
    } catch (e) {
      console.error(e)
    }
  }

  // Download certificate PNG
  const handleDownloadCertificate = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 700
    const ctx = canvas.getContext('2d')
    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.strokeStyle = '#c5a850'
    ctx.lineWidth = 15
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)
    
    ctx.strokeStyle = '#c5a850'
    ctx.lineWidth = 3
    ctx.strokeRect(35, 35, canvas.width - 70, canvas.height - 70)
    
    ctx.fillStyle = '#fdfcf7'
    ctx.fillRect(38, 38, canvas.width - 76, canvas.height - 76)
    
    ctx.font = '70px serif'
    ctx.textAlign = 'center'
    ctx.fillText('🏆', canvas.width / 2, 110)
    
    ctx.font = 'bold 38px Georgia, serif'
    ctx.fillStyle = '#1e293b'
    ctx.fillText('CERTIFICATE OF PARTICIPATION', canvas.width / 2, 180)
    
    ctx.font = 'italic 20px Georgia, serif'
    ctx.fillStyle = '#64748b'
    ctx.fillText('This is proudly presented to', canvas.width / 2, 240)
    
    ctx.font = 'bold 44px Georgia, serif'
    ctx.fillStyle = '#b45309'
    ctx.fillText(userName, canvas.width / 2, 310)
    
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(300, 345)
    ctx.lineTo(700, 345)
    ctx.stroke()
    
    ctx.font = '18px Arial'
    ctx.fillStyle = '#334155'
    const eventDate = new Date(event.datetime).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
    ctx.fillText(`for active and successful participation in the campus event`, canvas.width / 2, 395)
    ctx.font = 'bold italic 20px Arial'
    ctx.fillStyle = '#1e1b4b'
    ctx.fillText(`"${event.title}"`, canvas.width / 2, 425)
    ctx.font = '18px Arial'
    ctx.fillStyle = '#334155'
    ctx.fillText(`organized by the Eventify platform on ${eventDate}.`, canvas.width / 2, 455)
    
    ctx.font = 'bold 16px Arial'
    ctx.fillStyle = '#059669'
    ctx.fillText('MAR Points Verified: 50 XP Accredited 🛡️', canvas.width / 2, 500)
    
    ctx.font = 'italic 16px Georgia, serif'
    ctx.fillStyle = '#1e293b'
    ctx.fillText('Platform Organizing Committee', 250, 595)
    ctx.fillText('RCCIT Academic Dean / Principal', 750, 595)
    
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(150, 565)
    ctx.lineTo(350, 565)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(650, 565)
    ctx.lineTo(850, 565)
    ctx.stroke()
    
    ctx.font = '22px Arial'
    ctx.fillStyle = '#c5a850'
    ctx.fillText('RCCIT VALIDATED', canvas.width / 2, 580)
    
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `Certificate_${event.title.replace(/\s+/g, '_')}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    alert('Certificate downloaded! 🎓')
  }

  // Export report to CSV
  const handleExportCSV = () => {
    const headers = ['Attendee Name', 'Department', 'Role', 'Status']
    const rows = attendeesList.map(a => [
      a.name,
      a.department || 'N/A',
      a.role,
      'Registered'
    ])
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${event.title.replace(/\s+/g, '_')}_Attendees_Report.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Context-only AI Assistant answer generation
  const handleSendAIMessage = () => {
    if (!aiMessage.trim()) return
    const userMsg = aiMessage.trim()
    setAiChatHistory(prev => [...prev, { role: 'user', content: userMsg }])
    setAiMessage('')
    setTimeout(() => {
      const response = answerQuestion(userMsg, event)
      setAiChatHistory(prev => [...prev, { role: 'assistant', content: response }])
    }, 500)
  }

  const answerQuestion = (q, ev) => {
    const query = q.toLowerCase()
    if (query.includes('hi') || query.includes('hello') || query.includes('hey')) {
      return `Hello ${userName}! 👋 I'm the AI assistant for **${ev.title}**. Ask me about the rules, food, next sessions, prizes, or map!`;
    }
    if (query.includes('where') || query.includes('venue') || query.includes('location') || query.includes('room') || query.includes('map')) {
      return `The event is located at **${ev.venue}**. You can view a detailed SVG Map showing Main Stage and food court under the **RESOURCES** tab! 🗺️`;
    }
    if (query.includes('prize') || query.includes('pool') || query.includes('reward') || query.includes('cash') || query.includes('win')) {
      if (ev.prizes) return `The prize details for this event are:\n\n**${ev.prizes}** 🏆`;
      return `No specific prize amount is stated. However, participation grants you badged achievements and 20 MAR points!`;
    }
    if (query.includes('rule') || query.includes('guideline') || query.includes('rules')) {
      return ev.rules 
        ? `Here are the rules for the event:\n\n${ev.rules} 📋`
        : `Rules details are listed in the Overview tab. Please follow standard college guidelines!`;
    }
    if (query.includes('lunch') || query.includes('food') || query.includes('eat') || query.includes('meal') || query.includes('menu') || query.includes('dinner')) {
      return `Meals are served at the **Food Court**. Menu availability and meal slot timings are live inside **RESOURCES -> Food Court**! 🍲`;
    }
    if (query.includes('session') || query.includes('next') || query.includes('time') || query.includes('agenda') || query.includes('ongoing')) {
      let resp = ''
      if (ev.current_session) resp += `Current Live Session: **"${ev.current_session}"** ▶\n`
      if (ev.next_session) resp += `Up Next: **"${ev.next_session}"** ⏭\n`
      if (ev.agenda && ev.agenda.length > 0) resp += `Full timelines are accessible inside the **SCHEDULE** tab!`
      return resp || `Check the **SCHEDULE** tab for session breakdowns! 📅`;
    }
    return `I only have information about **${ev.title}**. Try asking about the venue, rules list, prizes, next agenda items, or meals! 🤖`;
  }

  // Toggles expanded FAQs accordion (Screenshot 3 style)
  const toggleFAQ = (index) => {
    setExpandedFAQ(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  // Toggles active quiz from the dropdown list
  const selectQuiz = (quizId) => {
    setActiveQuizId(quizId)
    setSelectedQuizOption(null)
  }

  // Dynamic devfolio style tab deck: OVERVIEW, PRIZES, SCHEDULE, LEADERBOARD, DASHBOARD
  const tabDeck = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'prizes', label: 'PRIZES' },
    { id: 'schedule', label: 'SCHEDULE' },
    { id: 'leaderboard', label: 'LEADERBOARD' },
    { id: 'dashboard', label: 'DASHBOARD' }
  ]

  if (userRole === 'organizer' || userRole === 'admin') {
    tabDeck.push({ id: 'analytics', label: 'ANALYTICS' })
    tabDeck.push({ id: 'organizer', label: 'ORGANIZER CONTROL' })
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-slate-100 font-bold text-xl">
        Loading Event Details...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 pb-20 relative overflow-hidden font-sans">
      
      {/* Organizer View Toggle */}
      {(userRole === 'organizer' || userRole === 'admin') && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 bg-slate-900 p-2 rounded-2xl shadow-2xl border border-slate-800">
          <button 
            onClick={() => setViewMode('public')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition ${viewMode === 'public' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            👀 Student View
          </button>
          <button 
            onClick={() => setViewMode('organizer')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition ${viewMode === 'organizer' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            🛠️ Organizer View
          </button>
        </div>
      )}

      {/* Blurry gradient bubbles for design aesthetics */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />

      {/* ── SCREENSHOT 1 STYLED HEADER NAVBAR ───────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-indigo-500/20">
            {ET_ICONS[event.event_type] || '📌'}
          </div>
          <div>
            <div className="font-black text-white text-base leading-tight tracking-tight uppercase">{event.title}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{event.category} - Operating System</div>
          </div>
        </div>

        {/* Horizontal Navigation List (Screenshot 1: About, Problems, Events, Timeline...) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-400">
          <button onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-indigo-400 transition">About</button>
          
          {event.event_type === 'hackathon' && (
            <button onClick={() => document.getElementById('problems-section')?.scrollIntoView({ behavior: 'smooth' })} className="bg-slate-800 text-indigo-400 border border-slate-700 px-3 py-1 rounded-full hover:bg-slate-700 transition">Problems</button>
          )}

          <button onClick={() => document.getElementById('prizes-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-indigo-400 transition">Prizes</button>
          <button onClick={() => document.getElementById('schedule-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-indigo-400 transition">Timeline</button>
          <button onClick={() => document.getElementById('dashboard-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-indigo-400 transition">Dashboard</button>
          <button onClick={() => document.getElementById('food-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-indigo-400 transition">Food Court</button>
          <button onClick={() => document.getElementById('helpdesk-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-indigo-400 transition">Contact Us / Support</button>
          
          {event.phase === 'after' ? (
            <button onClick={handleDownloadCertificate} className="bg-amber-600/90 text-white px-3 py-1 rounded-full hover:bg-amber-600 transition flex items-center gap-1 border border-amber-400/20">
              Download Certificate 🎓
            </button>
          ) : (
            <button onClick={() => window.open(`https://api.devfolio.co/api/hackathons?page=1&per_page=10`)} className="bg-slate-900 border border-slate-800 text-slate-300 px-3.5 py-1.5 rounded-full hover:bg-slate-800 transition">Download Brochure</button>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className="bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs px-3.5 py-2 rounded-full transition flex items-center gap-1 shadow-lg shadow-indigo-500/10 border border-indigo-400/20"
          >
            <span>🤖</span> AI Assist
          </button>
          
          <button onClick={handleBookmark} className="text-xl hover:scale-110 transition p-2 bg-slate-900 border border-slate-800 rounded-full">
            {bookmarked ? '🔖' : '🤍'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 pt-6 relative z-10">

        {/* Global Alert for Active Live Quizzes (All-In-One Widget Access) */}
        {quizzes.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/20 via-indigo-500/10 to-transparent border border-amber-500/30 rounded-2xl p-4 mb-6 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">⚡</span>
              <div>
                <h4 className="font-black text-white text-sm">LIVE XP QUIZ CHALLENGE RUNNING!</h4>
                <p className="text-xs text-slate-300">Answer quizzes directly inside this page to earn badged points instantly.</p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                document.getElementById('dashboard-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition"
            >
              Play All-In-One Quiz Now
            </button>
          </div>
        )}

        

        {/* ── TAB PORTALS ─────────────────────────────────────────────────── */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md">

          {/* 1. OVERVIEW TAB (Screenshot 2 / 3 details: description, venue highlight, rules, Accordion FAQs) */}
          <div id="about-section" className="py-20 max-w-7xl mx-auto scroll-mt-24">
            <div className="space-y-8">
              
              {/* Description Card (Screenshot 2 style) */}
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4">
                <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest">CODE. CREATE. CONQUER.</p>
                
                <h2 className="text-2xl font-black text-white">{event.title} 2.0</h2>
                
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {event.description || `${event.title} is where ambition meets opportunity. Compete for massive cash prizes, cool goodies and some Swag Se Swagat. Most importantly, unlock unparalleled networking by connecting directly with industry experts, gain insights, and showcase your talent!`}
                </p>

                {/* Styled Explicit Venue Section (Screenshot 2 style) */}
                <div className="border-t border-slate-800 pt-4 mt-2">
                  <div className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <span>📍 Venue -</span> 
                    <span className="text-blue-400">{event.venue || 'SMCC Building, Jadavpur University, Salt Lake Campus'}</span>
                  </div>
                </div>

                {/* Rules & Code of Conduct link (Screenshot 2 style) */}
                <div className="pt-2">
                  <h4 className="font-bold text-slate-200 text-sm">Rules</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Follow the <a href="#rules" onClick={() => alert('Code of Conduct loaded: Be respectful, follow specifications, and cooperate with organizers.')} className="text-blue-400 hover:underline font-bold">Code of Conduct</a>.
                  </p>
                </div>

                {/* Social Share links (Screenshot 2 style) */}
                <div className="pt-2">
                  <h4 className="font-bold text-slate-300 text-[10px] uppercase tracking-wider mb-2">Find us on</h4>
                  <div className="flex gap-2">
                    <button onClick={() => alert('Devfolio registration linked! 🚀')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition">Devfolio</button>
                    <button onClick={() => alert('Platform discord group linked!')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition">Discord</button>
                    <button onClick={() => alert('Linked sharing triggered')} className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition">LinkedIn</button>
                  </div>
                </div>
              </div>

              {/* Category Specific Problems Deck (Screenshot 1 "Problems" link target) */}
              {event.event_type === 'hackathon' && (
                <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900 border border-indigo-500/20 p-6 rounded-3xl space-y-4 shadow-xl scroll-mt-24" id="problems-section">
                  <h3 className="font-black text-white text-base flex items-center gap-2">
                    <span>💻</span> HACKATHON PROBLEMS & TRACKS
                  </h3>
                  <div className="flex gap-2 items-center mt-2">
                    <button 
                      onClick={() => {
                        const link = `${window.location.origin}/event/${id}?playQuiz=true`;
                        navigator.clipboard.writeText(link);
                        alert(`Shareable Quiz Link Copied: \n${link}`);
                      }} 
                      className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-indigo-500/40 transition"
                    >
                      🔗 {userRole === 'organizer' ? 'Generate Link' : 'Get Play Link'}
                    </button>
                  </div>
                  
                  {event.specifics?.hackathon_problem_statements ? (
                    <div className="space-y-4">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div className="text-slate-400 text-xs font-bold uppercase mb-1">Problem Statement</div>
                        <p className="text-xs text-slate-200 leading-relaxed italic">{event.specifics.hackathon_problem_statements}</p>
                      </div>

                      {event.specifics.hackathon_tracks && (
                        <div>
                          <div className="text-slate-400 text-xs font-bold uppercase mb-1.5">Problem Tracks</div>
                          <div className="flex flex-wrap gap-2">
                            {event.specifics.hackathon_tracks.map(t => (
                              <span key={t} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs px-3 py-1 rounded-full font-bold">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">
                      Problem statements will release at keynote launch. Stay tuned to live dashboard announcements!
                    </div>
                  )}
                </div>
              )}

              {/* Accordion FAQ Block (Screenshot 3 style) */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>❓</span> FAQ & General Queries
                </h3>

                <div className="space-y-3">
                  {/* Item 1 */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden transition">
                    <button 
                      onClick={() => toggleFAQ(0)}
                      className="w-full px-5 py-4 flex justify-between items-center font-bold text-slate-200 text-sm hover:text-white transition"
                    >
                      <span>What is a hackathon?</span>
                      <span className="text-slate-500 text-lg">{expandedFAQ[0] ? '▲' : '▼'}</span>
                    </button>
                    {expandedFAQ[0] && (
                      <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/40 pt-3">
                        A hackathon is a social coding event where programmers, designers, and developers collaborate to solve a problem and compete for cash prizes. It's one part party, one part work-hard overnight battle against the clock and the competition.
                      </div>
                    )}
                  </div>

                  {/* Item 2 */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden transition">
                    <button 
                      onClick={() => toggleFAQ(1)}
                      className="w-full px-5 py-4 flex justify-between items-center font-bold text-slate-200 text-sm hover:text-white transition"
                    >
                      <span>What is {event.title}?</span>
                      <span className="text-slate-500 text-lg">{expandedFAQ[1] ? '▲' : '▼'}</span>
                    </button>
                    {expandedFAQ[1] && (
                      <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/40 pt-3">
                        {event.title} is an exciting event hosted on Eventify. It's a high-energy, innovation-filled event where participants from all over come together to collaborate, learn, and showcase their skills.
                      </div>
                    )}
                  </div>

                  {/* Item 3 */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden transition">
                    <button 
                      onClick={() => toggleFAQ(2)}
                      className="w-full px-5 py-4 flex justify-between items-center font-bold text-slate-200 text-sm hover:text-white transition"
                    >
                      <span>Who can participate?</span>
                      <span className="text-slate-500 text-lg">{expandedFAQ[2] ? '▲' : '▼'}</span>
                    </button>
                    {expandedFAQ[2] && (
                      <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/40 pt-3">
                        {event.title} is open to all enthusiasts and participants! Whether you're a beginner, a professional, or just someone with great ideas, you're welcome to join and participate!
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 2. PRIZES TAB */}
          <div id="prizes-section" className="py-20 max-w-7xl mx-auto scroll-mt-24">
            <div className="space-y-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>🏆</span> Prize Pool & Sponsors
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1st prize */}
                <div className="bg-gradient-to-br from-amber-500/20 to-slate-900 border border-amber-500/30 p-6 rounded-3xl text-center space-y-3 relative overflow-hidden">
                  <div className="text-4xl">🥇</div>
                  <h4 className="font-bold text-white text-sm">FIRST PLACE CHAMPION</h4>
                  <div className="text-3xl font-black text-amber-400">
                    {event.prizes ? event.prizes.split(';')[0] || event.prizes : '₹50,000 Cash'}
                  </div>
                  <p className="text-[10px] text-slate-400">Accredited Trophy + Premium Swag Bags</p>
                </div>

                {/* 2nd prize */}
                <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl text-center space-y-3">
                  <div className="text-4xl">🥈</div>
                  <h4 className="font-bold text-white text-sm">RUNNER UP</h4>
                  <div className="text-2xl font-black text-slate-300">
                    {event.prizes ? event.prizes.split(';')[1] || '₹30,000 Cash' : '₹30,000 Cash'}
                  </div>
                  <p className="text-[10px] text-slate-400">Trophy + Swag Bags</p>
                </div>

                {/* 3rd prize */}
                <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl text-center space-y-3">
                  <div className="text-4xl">🥉</div>
                  <h4 className="font-bold text-white text-sm">THIRD PLACE</h4>
                  <div className="text-2xl font-black text-amber-600">
                    {event.prizes ? event.prizes.split(';')[2] || '₹15,000 Cash' : '₹15,000 Cash'}
                  </div>
                  <p className="text-[10px] text-slate-400">Certificate + Swags</p>
                </div>

              </div>

              {/* Sponsors Section (Screenshot 1: Sponsors list) */}
              <div className="bg-slate-850 border border-slate-800 p-6 rounded-3xl space-y-4 mt-6">
                <h4 className="text-sm font-black text-white uppercase tracking-wider">PLATINUM SPONSORS</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-center font-bold text-slate-400 text-xs">
                    🚀 Devfolio
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-center font-bold text-slate-400 text-xs">
                    💻 GitHub Student
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-center font-bold text-slate-400 text-xs">
                    🎨 Figma Design
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-center font-bold text-slate-400 text-xs">
                    ☁️ AWS Educate
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 3. SCHEDULE TAB */}
          <div id="schedule-section" className="py-20 max-w-7xl mx-auto scroll-mt-24">
            <div className="space-y-6">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <span>📅</span> Sessions & Hackathon Timeline
              </h3>

              {!event.agenda || event.agenda.length === 0 ? (
                <div className="text-center py-10 bg-slate-800/10 border border-slate-800 rounded-3xl text-slate-500 text-xs">
                  Timeline schedule is currently empty.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-indigo-500/20 space-y-6">
                  {event.agenda.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[29px] w-4 h-4 rounded-full border-4 border-slate-950 bg-indigo-500 ring-2 ring-indigo-500/30 top-1.5" />
                      
                      <div className="bg-slate-800/20 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                          <span className="text-indigo-400 font-mono text-xs font-black">{item.time}</span>
                          <h4 className="font-bold text-white text-sm mt-0.5">{item.session}</h4>
                          <p className="text-[10px] text-slate-500">Venue: {item.location || 'Main Auditorium'}</p>
                        </div>
                        
                        {item.speaker && (
                          <span className="text-xs text-slate-300 font-semibold bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                            🎤 Speaker: {item.speaker}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. LEADERBOARD TAB */}
          <div id="leaderboard-section" className="py-20 max-w-7xl mx-auto scroll-mt-24">
            <div className="space-y-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>🏆</span> Gamified XP Leaderboard
              </h3>

              <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-slate-400 text-xs font-bold">Attendee Name</span>
                  <span className="text-slate-400 text-xs font-bold">XP Score</span>
                </div>

                <div className="space-y-2">
                  {quizLeaderboard.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">No XP records calculated. Go to Dashboard to play the live quiz!</div>
                  ) : (
                    quizLeaderboard.map((lb, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-950 border border-slate-900 px-4 py-2.5 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-500">{idx + 1}.</span>
                          <span className="font-bold text-slate-200 text-xs">{lb.name}</span>
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">{lb.department || 'CS'}</span>
                        </div>
                        <span className="font-black text-amber-400 text-xs">{lb.points} XP</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 5. DASHBOARD TAB (All-In-One Events Deck: Quizzes, Food management, Support) */}
          <div id="dashboard-section" className="py-20 max-w-7xl mx-auto">
            <div className="space-y-8">
              
              {/* ── ALL-IN-ONE QUIZ ARENA INTEGRATION ── */}
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4" id="quiz-arena-section">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-white text-sm flex items-center gap-2">
                    <span>📝</span> Live Quiz Arena
                  </h3>
                  
                  {quizzes.length > 0 && (
                    <select
                      value={activeQuizId || ''}
                      onChange={e => selectQuiz(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                    >
                      {quizzes.map((q, idx) => (
                        <option key={q.id} value={q.id}>Quiz {idx + 1}</option>
                      ))}
                    </select>
                  )}
                </div>

                {quizzes.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs italic bg-slate-950/30 rounded-2xl border border-slate-900">
                    No active quizzes running for this event currently.
                  </div>
                ) : (
                  (() => {
                    const currentQuiz = quizzes.find(q => q.id === activeQuizId) || quizzes[0]
                    const attempted = quizSubmissions.includes(currentQuiz.id)
                    return (
                      <div className="bg-slate-950 border border-slate-900 p-5 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                          <span>QUESTION CHALLENGE</span>
                          <span className="text-amber-400">+{currentQuiz.points || 50} XP</span>
                        </div>

                        <h4 className="font-bold text-slate-200 text-sm leading-relaxed">
                          {currentQuiz.question}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {currentQuiz.options.map((opt, oIdx) => {
                            const optChar = ['A', 'B', 'C', 'D'][oIdx]
                            return (
                              <button
                                key={oIdx}
                                onClick={() => setSelectedQuizOption(optChar)}
                                disabled={attempted}
                                className={`w-full text-left rounded-xl px-4 py-3 text-xs font-semibold border transition ${
                                  selectedQuizOption === optChar
                                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                                    : attempted
                                      ? 'border-slate-900 bg-slate-950 text-slate-600 cursor-not-allowed'
                                      : 'border-slate-850 bg-slate-900 hover:border-slate-700 text-slate-300'
                                }`}
                              >
                                <span className="text-indigo-400 mr-2">{optChar}.</span> {opt}
                              </button>
                            )
                          })}
                        </div>

                        {!attempted ? (
                          <button
                            onClick={() => handleAttemptQuiz(currentQuiz.id)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition"
                          >
                            Submit Quiz Answer
                          </button>
                        ) : (
                          <div className="text-center text-xs text-slate-500 font-bold bg-slate-900/50 py-2 rounded-xl">
                            ✓ Answer submitted! Verify Leaderboard points.
                          </div>
                        )}
                      </div>
                    )
                  })()
                )}
              </div>

              {/* ── FOOD COURT & MEAL MANAGEMENT PANEL ── */}
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4 animate-fade-in" id="food-section">
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <span>🍲</span> Food Court & Meal Management
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
                  Claim food coupons for your meals. Note: Meal claiming requires you to physically check-in at a room zone first!
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left side: Available Meal Menu Cards */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-200">🍛 Lunch Combo Buffet</div>
                        <p className="text-[10px] text-slate-500">Menu: Veg Pulao, Paneer Masala, Salad, Sweets</p>
                        <span className="text-[10px] text-indigo-400">Serving 1:30 PM - 3:30 PM</span>
                      </div>
                      
                      {myCoupons.some(c => c.meal === 'Lunch') ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded font-bold uppercase text-[9px]">
                          Claimed 🎫
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleClaimMeal('Lunch')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          Claim Coupon
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-200">🍪 Evening Snacks & Chai</div>
                        <p className="text-[10px] text-slate-500">Menu: Hot Samosas, Biscuits, Masala Tea</p>
                        <span className="text-[10px] text-indigo-400">Serving 5:30 PM - 6:30 PM</span>
                      </div>
                      
                      {myCoupons.some(c => c.meal === 'Snacks') ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded font-bold uppercase text-[9px]">
                          Claimed 🎫
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleClaimMeal('Snacks')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          Claim Coupon
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right side: Claimed active Coupon display */}
                  <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between text-center space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Your Meal Ticket</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Show this to the food court operator to serve meal.</p>
                    </div>

                    {myCoupons.length === 0 ? (
                      <div className="text-xs text-slate-600 italic py-6">Claim your first meal coupon to display QR ticket!</div>
                    ) : (
                      (() => {
                        const latest = myCoupons[myCoupons.length - 1]
                        return (
                          <div className="space-y-2">
                            <div className="bg-white p-2.5 rounded-xl inline-block shadow border">
                              <QRCode value={`eventify:food_coupon:${latest.id}`} size={100} />
                            </div>
                            <div className="text-[10px] text-slate-200 font-bold">{latest.meal} Ticket</div>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                              latest.verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {latest.verified ? 'VERIFIED / SERVED 🍲' : 'CLAIMED / ACTIVE 🎫'}
                            </span>
                            <div className="text-[8px] text-slate-500 font-mono mt-1">ID: {latest.id}</div>
                          </div>
                        )
                      })()
                    )}
                  </div>

                </div>
              </div>

              {/* Help Desk Support (Screenshot 2 Contact Us / Support target) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4" id="helpdesk-section">
                
                {/* Submit Ticket */}
                <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <h3 className="font-black text-white text-sm flex items-center gap-2">
                    <span>🆘</span> Help Desk Support Alert
                  </h3>
                  
                  <form onSubmit={handleSubmitHelpTicket} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Category</label>
                        <select
                          value={helpCat}
                          onChange={e => setHelpCat(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
                        >
                          <option value="query">General Query</option>
                          <option value="lost-item">Lost & Found Item</option>
                          <option value="emergency">Emergency Alert</option>
                          <option value="medical">Medical Assistance</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Priority</label>
                        <select
                          value={helpPriority}
                          onChange={e => setHelpPriority(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">Urgent Emergency</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Message</label>
                      <textarea
                        value={helpMsg}
                        onChange={e => setHelpMsg(e.target.value)}
                        placeholder="Detail your request or query here..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none h-16 resize-none"
                        required
                      />
                    </div>

                    <button type="submit" disabled={submittingHelp} className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-2 rounded-xl transition">
                      {submittingHelp ? 'Submitting...' : 'Submit Support Ticket'}
                    </button>
                  </form>
                </div>

                {/* Queue status */}
                <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <h3 className="font-black text-white text-sm">🆘 Active Help Desk Queue</h3>
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {helpTickets.length === 0 ? (
                      <div className="text-center py-10 text-slate-600 text-xs italic">No support tickets in queue currently!</div>
                    ) : (
                      helpTickets.map((t, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-900 p-3 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full mr-2 ${
                              t.resolved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {t.resolved ? 'Resolved' : 'Pending'}
                            </span>
                            <span className="font-bold text-slate-300">Ticket #{t.id} ({t.category})</span>
                            <p className="text-slate-400 mt-1">{t.message}</p>
                          </div>
                          
                          {(userRole === 'organizer' || userRole === 'admin') && !t.resolved && (
                            <button onClick={() => handleResolveTicket(t.id)} className="bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold text-white px-2 py-0.5 rounded">
                              Resolve
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* 6. ANALYTICS TAB (Organizer Only) */}
          {viewMode === 'organizer' && (userRole === 'organizer' || userRole === 'admin') && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/20 border border-slate-800 p-4 rounded-2xl text-center">
                  <div className="text-slate-500 text-xs font-bold uppercase mb-1">Registrations</div>
                  <div className="text-3xl font-black text-indigo-400">{count}</div>
                </div>
                <div className="bg-slate-800/20 border border-slate-800 p-4 rounded-2xl text-center">
                  <div className="text-slate-500 text-xs font-bold uppercase mb-1">XP Leaderboard size</div>
                  <div className="text-3xl font-black text-amber-400">{quizLeaderboard.length}</div>
                </div>
                <div className="bg-slate-800/20 border border-slate-800 p-4 rounded-2xl text-center">
                  <div className="text-slate-500 text-xs font-bold uppercase mb-1">No-Show rate</div>
                  <div className="text-3xl font-black text-rose-400">8%</div>
                </div>
                <div className="bg-slate-800/20 border border-slate-800 p-4 rounded-2xl text-center">
                  <div className="text-slate-500 text-xs font-bold uppercase mb-1">Health Score</div>
                  <div className="text-3xl font-black text-emerald-400">96 XP</div>
                </div>
              </div>

              {/* Budget spread */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800/20 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <h3 className="font-bold text-white text-sm">📊 Attendee Department Spread</h3>
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Computer Science (CS)</span>
                        <span className="font-bold">48%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: '48%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Electronics Engineering (ECE)</span>
                        <span className="font-bold">24%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: '24%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/20 border border-slate-800 p-5 rounded-2xl space-y-2">
                  <h3 className="font-bold text-white text-sm">💰 Budget Ledger Summary</h3>
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
                      <span className="text-slate-400">Total Sponsorships</span>
                      <span className="font-bold text-emerald-400">₹85,000</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
                      <span className="text-slate-400">Catering Expenses</span>
                      <span className="font-bold text-rose-400">-₹35,000</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-200 font-bold">Net Profit</span>
                      <span className="font-black text-emerald-400 text-sm">₹30,000</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 7. ORGANIZER CONTROL TAB (Organizer Only) */}
          {/* ── ORGANIZER MODE ── */}
      {viewMode === 'organizer' && (userRole === 'organizer' || userRole === 'admin') && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Announcement broadcaster */}
                <div className="bg-slate-800/20 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <h3 className="font-bold text-white text-xs">📢 Push Live Ticker Announcement</h3>
                  <textarea
                    value={newAnnouncement}
                    onChange={e => setNewAnnouncement(e.target.value)}
                    placeholder="Type live notification message..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none h-16 resize-none"
                  />
                  <button onClick={handlePushAnnouncement} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 rounded-lg transition">
                    Broadcast Live Announcement
                  </button>
                </div>

                {/* Live Food Coupon verification scanner */}
                <div className="bg-slate-800/20 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <h3 className="font-bold text-white text-xs">🍲 Verify Food Meal Ticket</h3>
                  <p className="text-[10px] text-slate-500">Scan or type student meal coupon code manually to verify servings.</p>
                  
                  <form onSubmit={handleVerifyMealCoupon} className="space-y-2">
                    <input
                      type="text"
                      value={verifyCouponCode}
                      onChange={e => setVerifyCouponCode(e.target.value)}
                      placeholder="e.g. MEAL-1-XXXX-LUNCH"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                      required
                    />
                    <button type="submit" disabled={verifyingMeal} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 rounded-lg transition">
                      {verifyingMeal ? 'Verifying Coupon...' : 'Verify Coupon Code'}
                    </button>
                  </form>
                </div>

                {/* Complete & Certificate trigger */}
                <div className="bg-slate-800/20 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-white text-xs">🏆 Complete Event Phase</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Unlock certificate participation downloads and rating reviews for attendees.</p>
                  </div>
                  
                  <div className="space-y-2">
                    {event.phase !== 'after' ? (
                      <button onClick={handleToggleCompletion} className="w-full bg-emerald-600 hover:bg-emerald-750 text-white font-bold text-xs py-2 rounded-lg transition">
                        Complete Event & Unlock Certs
                      </button>
                    ) : (
                      <div className="text-center text-xs font-bold text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                        ✓ Certificates & Feedback Unlocked
                      </div>
                    )}
                    <button onClick={handleExportCSV} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs py-2 rounded-lg transition">
                      Export Attendees CSV Report
                    </button>
                  </div>
                </div>

              </div>

              {/* Quiz creator & event detail parameters */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                
                {/* Create Quiz */}
                <div className="bg-slate-800/20 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <h3 className="font-bold text-white text-xs">📝 Add Quiz Challenge</h3>
                  
                  <form onSubmit={handleCreateQuiz} className="space-y-2 text-xs">
                    <input
                      type="text"
                      value={newQuizQuestion}
                      onChange={e => setNewQuizQuestion(e.target.value)}
                      placeholder="Question..."
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none"
                      required
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={newQuizOptA}
                        onChange={e => setNewQuizOptA(e.target.value)}
                        placeholder="Option A..."
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none"
                        required
                      />
                      <input
                        type="text"
                        value={newQuizOptB}
                        onChange={e => setNewQuizOptB(e.target.value)}
                        placeholder="Option B..."
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <select 
                        value={newQuizCorrect}
                        onChange={e => setNewQuizCorrect(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none flex-1"
                      >
                        <option value="A">Correct: A</option>
                        <option value="B">Correct: B</option>
                      </select>
                      <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded text-[10px]">
                        Add Quiz
                      </button>
                    </div>
                  </form>
                </div>

                {/* Edit event form */}
                <div className="lg:col-span-2 bg-slate-800/20 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <h3 className="font-bold text-white text-xs">🛠️ Edit Event Parameters</h3>
                  
                  <form onSubmit={handleUpdateEventDetails} className="space-y-3 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Description</label>
                      <textarea
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none h-14 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Rules</label>
                        <textarea
                          value={editRules}
                          onChange={e => setEditRules(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none h-14 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Prizes</label>
                        <input
                          type="text"
                          value={editPrizes}
                          onChange={e => setEditPrizes(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs py-2 rounded-xl transition">
                      Save Specifications
                    </button>
                  </form>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* ── AFTER EVENT FEATURES ── */}
        {event.phase === 'after' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 animate-fade-in">
            
            {/* Certificate builder */}
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-between space-y-4">
              <div>
                <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase inline-block mb-3">
                  ACCERTIFICATE UNLOCKED 🎓
                </span>
                <h3 className="text-lg font-black text-white leading-tight mb-2">DYNAMIC CERTIFICATE OF PARTICIPATION</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  RCCIT validates your active participation in <strong>{event.title}</strong>! Accredit your profile and download your premium certificate immediately.
                </p>
              </div>

              {/* Certificate preview */}
              <div className="border-4 border-amber-500/20 bg-slate-950 p-6 rounded-2xl text-center space-y-3 relative overflow-hidden shadow-inner my-2">
                <div className="text-4xl">🏅</div>
                <div className="font-serif text-sm tracking-wider text-slate-300">CERTIFICATE OF PARTICIPATION</div>
                <div className="text-[10px] text-slate-500 italic">This is proudly accredited to</div>
                <div className="font-serif text-base font-bold text-amber-400 uppercase tracking-widest">{userName}</div>
                <p className="text-[9px] text-slate-450 leading-relaxed">For successful completion of "{event.title}" campus activities.</p>
              </div>

              <button
                onClick={handleDownloadCertificate}
                className="w-full bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-sm py-3 rounded-2xl transition shadow flex items-center justify-center gap-2"
              >
                <span>🎓</span> Download Verified Certificate
              </button>
            </div>

            {/* Ratings & Feedback */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-base">💬 Review & Ratings</h3>
                <p className="text-slate-400 text-xs mt-1">Share feedback comments to optimize future RCCIT events!</p>
              </div>

              {feedbackSubmitted ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-4 text-center text-xs font-bold my-4">
                  <span>💚</span> Feedback review submitted successfully! Thank you.
                </div>
              ) : (
                <div className="space-y-4 my-2">
                  <div className="flex gap-1.5 justify-center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setMyRating(star)}
                        className={`text-3xl transition ${star <= myRating ? 'text-amber-400 scale-110' : 'text-slate-700 hover:text-slate-500'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={myComment}
                    onChange={e => setMyComment(e.target.value)}
                    placeholder="Describe your review comment here..."
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 text-xs text-slate-200 focus:outline-none h-20 resize-none"
                    required
                  />

                  <button
                    onClick={handleSubmitFeedback}
                    disabled={submittingFeedback}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs py-2.5 rounded-xl transition"
                  >
                    Submit Review Comment
                  </button>
                </div>
              )}

              <div className="text-center text-[10px] text-slate-500 mt-2 font-mono">
                Verified participant logging
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ── ASSISTANT FLOATING DRAWER PANEL ──────────────────────────────────── */}
      {showAIAssistant && (
        <div className="fixed top-0 bottom-0 right-0 z-50 w-full sm:w-96 bg-slate-900/95 border-l border-slate-850 shadow-2xl backdrop-blur-md flex flex-col justify-between">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-bold text-white text-sm">AI Assistant</h3>
                <span className="text-[10px] text-indigo-400 font-bold">Contextual Event Data Bot</span>
              </div>
            </div>
            <button onClick={() => setShowAIAssistant(false)} className="text-slate-400 hover:text-white text-xl font-bold font-mono px-2">&times;</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {aiChatHistory.map((chat, idx) => (
              <div key={idx} className={`flex gap-2.5 ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {chat.role !== 'user' && <span className="text-xl">🤖</span>}
                <div className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed max-w-[85%] ${
                  chat.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-850 border border-slate-800 text-slate-250 rounded-tl-none whitespace-pre-line'
                }`}>
                  {chat.content}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          <div className="p-3 border-t border-slate-800 bg-slate-950/20 flex gap-2">
            <input
              type="text"
              value={aiMessage}
              onChange={e => setAiMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSendAIMessage() }}
              placeholder="Where is venue? food? prizes? rules?..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-105 focus:outline-none focus:border-indigo-600 transition"
            />
            <button onClick={handleSendAIMessage} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition">Ask</button>
          </div>
        </div>
      )}

      {/* ── ENTRY TICKET QR CODE MODAL ────────────────────────────────────────── */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowQR(false)}>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
            onClick={e => e.stopPropagation()}>
            
            <div className="absolute top-[-20%] left-[-20%] w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
            
            <h3 className="text-lg font-black text-white mb-1">EVENT ENTRY TICKET</h3>
            <p className="text-slate-400 text-xs mb-5">Scan this QR desk at entry gate registration counters.</p>
            
            <div className="bg-white p-4 inline-block rounded-2xl shadow-inner border border-slate-250 mb-4">
              <QRCode value={`eventify:user_${userId}:event_${event.id}`} size={160} />
            </div>
            
            <div className="font-mono text-[10px] text-slate-400 mb-5 uppercase tracking-wide">
              Event #{event.id} · Student: {userName.toUpperCase()}
            </div>
            
            <button 
              onClick={() => setShowQR(false)}
              className="w-full bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 py-3 rounded-2xl font-bold text-xs transition"
            >
              Close Entry Ticket
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Confetti celebration */}
      {showConfetti && (
        <Confetti width={width} height={height} recycle={false} numberOfPieces={350} gravity={0.16} />
      )}

    </div>
  )
}
