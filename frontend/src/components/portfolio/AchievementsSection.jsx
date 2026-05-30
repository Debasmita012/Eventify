import React from 'react'
import { Trophy, Star, Shield, Medal, Hexagon, Zap } from 'lucide-react'

export default function AchievementsSection({ totalCertificates }) {
  // Badge Rules: 1: Event Starter, 3: Bronze Achiever, 5: Silver, 10: Gold, 15: Champion, 25: Legend
  // Special Badges logic will be mocked simply based on thresholds
  const badges = []
  
  if (totalCertificates >= 1) badges.push({ name: 'Event Starter', icon: <Star className="w-6 h-6 text-yellow-500" />, desc: '1+ Certificate', color: 'bg-yellow-50 border-yellow-100' })
  if (totalCertificates >= 3) badges.push({ name: 'Bronze Achiever', icon: <Medal className="w-6 h-6 text-orange-400" />, desc: '3+ Certificates', color: 'bg-orange-50 border-orange-100' })
  if (totalCertificates >= 5) badges.push({ name: 'Silver Achiever', icon: <Shield className="w-6 h-6 text-gray-400" />, desc: '5+ Certificates', color: 'bg-gray-50 border-gray-200' })
  if (totalCertificates >= 10) badges.push({ name: 'Gold Achiever', icon: <Trophy className="w-6 h-6 text-yellow-400" />, desc: '10+ Certificates', color: 'bg-yellow-100 border-yellow-200' })
  if (totalCertificates >= 15) badges.push({ name: 'Campus Champion', icon: <Hexagon className="w-6 h-6 text-purple-500" />, desc: '15+ Certificates', color: 'bg-purple-50 border-purple-100' })
  if (totalCertificates >= 25) badges.push({ name: 'Event Legend', icon: <Zap className="w-6 h-6 text-red-500" />, desc: '25+ Certificates', color: 'bg-red-50 border-red-100' })

  // Fill up with special mock badges to make it look full
  if (totalCertificates > 0) {
    badges.push({ name: 'First Event Joined', icon: <Star className="w-5 h-5 text-blue-500" />, desc: 'Special Award', color: 'bg-blue-50 border-blue-100' })
  }
  if (totalCertificates >= 2) {
    badges.push({ name: 'Consistent Participant', icon: <Activity className="w-5 h-5 text-green-500" />, desc: 'Special Award', color: 'bg-green-50 border-green-100' })
  }

  if (badges.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-bold text-gray-900">Achievements</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {badges.map((b, i) => (
          <div key={i} className={`border rounded-xl p-4 flex flex-col items-center text-center ${b.color} transition-transform hover:scale-105 cursor-default`}>
            <div className="bg-white p-2 rounded-full shadow-sm mb-2 border border-black/5">
              {b.icon}
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-0.5">{b.name}</h3>
            <span className="text-xs text-gray-600 font-medium">{b.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
// Temporary mock import for Activity icon
import { Activity } from 'lucide-react'
