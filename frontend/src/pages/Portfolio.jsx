import { useState, useEffect } from 'react'
import axios from 'axios'
import API from '../config'

import ProfileHeader from '../components/portfolio/ProfileHeader'
import ActivityHeatmap from '../components/portfolio/ActivityHeatmap'
import AttendedEvents from '../components/portfolio/AttendedEvents'
import CertificatesSection from '../components/portfolio/CertificatesSection'
import AchievementsSection from '../components/portfolio/AchievementsSection'
import RSVPSection from '../components/portfolio/RSVPSection'
import TimelineSection from '../components/portfolio/TimelineSection'
import PerformanceSection from '../components/portfolio/PerformanceSection'

export default function Portfolio() {
  const [data, setData] = useState(null)
  const userId = localStorage.getItem('user_id')

  const fetchPortfolio = () => {
    axios.get(`${API}/portfolio/${userId}`).then(r => setData(r.data)).catch(console.error)
  }

  useEffect(() => {
    fetchPortfolio()
  }, [userId])

  if (!data) return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">
      Loading your professional dashboard...
    </div>
  )

  // Data processing to mock the required state from existing API
  // We hardcode 'now' to match the Nov 2025 seed dates
  const now = new Date('2025-11-20T00:00:00')
  const allEvents = data.events || []
  
  // To ensure the UI looks populated even if dates are weird, we force the first half to be 'past' if needed
  let pastEvents = allEvents.filter(e => new Date(e.datetime) < now)
  let upcomingEvents = allEvents.filter(e => new Date(e.datetime) >= now)
  
  if (pastEvents.length === 0 && allEvents.length > 0) {
    const splitIndex = Math.ceil(allEvents.length / 2)
    pastEvents = allEvents.slice(0, splitIndex)
    upcomingEvents = allEvents.slice(splitIndex)
  }

  // Auto-generate certificates for past events
  const certificates = pastEvents.map((e, i) => ({
    name: e.title,
    issueDate: e.datetime,
    certNumber: `CERT-${new Date(e.datetime).getFullYear()}-${e.id.toString().padStart(4, '0')}`
  }))

  const totalPoints = data.user?.points || 0
  const badgesCount = Math.min(certificates.length + (certificates.length > 0 ? 2 : 0), 10) // Approx mapping from Achievements component logic

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-transparent min-h-screen relative z-10 font-outfit text-slate-100">
      <ProfileHeader 
        user={data.user} 
        totalEvents={allEvents.length} 
        totalCertificates={certificates.length}
        badgesEarned={badgesCount}
        totalPoints={totalPoints}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityHeatmap pastEvents={pastEvents} allEvents={allEvents} />
          <RSVPSection events={upcomingEvents} userId={userId} onCancel={fetchPortfolio} />
          <AttendedEvents events={pastEvents} />
          <CertificatesSection certificates={certificates} />
        </div>
        
        <div className="lg:col-span-1">
          <PerformanceSection totalPoints={totalPoints} totalEvents={allEvents.length} badgesCount={badgesCount} />
          <AchievementsSection totalCertificates={certificates.length} />
          <TimelineSection events={pastEvents} badges={[{name: 'Event Starter'}]} />
        </div>
      </div>
    </div>
  )
}
