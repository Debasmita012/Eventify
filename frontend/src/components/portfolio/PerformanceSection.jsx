import React from 'react'
import { TrendingUp, Target } from 'lucide-react'

export default function PerformanceSection({ totalPoints, totalEvents, badgesCount }) {
  // Mock logic to calculate progress
  const nextBadgeThreshold = 25
  const currentBadgeCount = badgesCount
  const progressPercent = Math.min(100, Math.round((currentBadgeCount / nextBadgeThreshold) * 100))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-bold text-gray-900">Performance Summary</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col border-r border-gray-100 last:border-0">
          <span className="text-gray-500 text-xs font-semibold uppercase">Campus Rank</span>
          <span className="text-2xl font-bold text-gray-900">#42</span>
        </div>
        <div className="flex flex-col border-r border-gray-100 last:border-0">
          <span className="text-gray-500 text-xs font-semibold uppercase">Total Events</span>
          <span className="text-2xl font-bold text-gray-900">{totalEvents}</span>
        </div>
        <div className="flex flex-col border-r border-gray-100 last:border-0">
          <span className="text-gray-500 text-xs font-semibold uppercase">Participation</span>
          <span className="text-2xl font-bold text-gray-900">Top 15%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs font-semibold uppercase">Total Points</span>
          <span className="text-2xl font-bold text-gray-900">{totalPoints}</span>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-sm text-gray-700 flex items-center gap-1.5"><Target className="w-4 h-4 text-indigo-500" /> Next Badge Progress</span>
          <span className="text-xs font-bold text-indigo-600">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-right">{currentBadgeCount} / {nextBadgeThreshold} badges unlocked</div>
      </div>
    </div>
  )
}
