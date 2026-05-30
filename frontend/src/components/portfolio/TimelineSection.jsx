import React from 'react'
import { Route } from 'lucide-react'

export default function TimelineSection({ events, badges }) {
  // Sort events chronologically to show a journey
  const sorted = [...events].sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
  
  if (sorted.length === 0) return null

  const journeyPoints = [
    { label: 'Joined Eventify', date: new Date().toLocaleDateString() }
  ]
  
  if (sorted.length > 0) {
    journeyPoints.push({ label: `Joined First Event: ${sorted[0].title}`, date: new Date(sorted[0].datetime).toLocaleDateString() })
  }
  if (sorted.length > 2) {
    journeyPoints.push({ label: `Became an Active Participant`, date: new Date(sorted[2].datetime).toLocaleDateString() })
  }
  if (badges.length > 0) {
    journeyPoints.push({ label: `Unlocked: ${badges[0].name}`, date: 'Recently' })
  }
  if (sorted.length > 0) {
    journeyPoints.push({ label: `Participated in ${sorted[sorted.length-1].title}`, date: new Date(sorted[sorted.length-1].datetime).toLocaleDateString() })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-6">
        <Route className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-bold text-gray-900">Event Journey</h2>
      </div>

      <div className="relative border-l-2 border-indigo-100 ml-3 space-y-6 pb-2">
        {journeyPoints.map((point, i) => (
          <div key={i} className="relative pl-6">
            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white ${i === journeyPoints.length - 1 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
            <div className="font-semibold text-gray-900 text-sm">{point.label}</div>
            <div className="text-xs text-gray-500">{point.date}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
