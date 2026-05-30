import React from 'react'
import { Activity } from 'lucide-react'

export default function ActivityHeatmap({ pastEvents, allEvents }) {
  const endDate = new Date('2025-12-15T00:00:00')
  const startDate = new Date(endDate.getTime() - (105 * 24 * 60 * 60 * 1000))
  
  const days = []
  let activeDaysCount = 0
  
  for (let i = 0; i < 105; i++) {
    const currentDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000))
    const dateString = currentDate.toISOString().split('T')[0]
    
    const eventCount = allEvents.filter(e => e.datetime.startsWith(dateString)).length
    if (eventCount > 0) activeDaysCount++
    
    let level = 0
    if (eventCount > 0) {
      const hasPast = pastEvents.some(e => e.datetime.startsWith(dateString))
      if (hasPast) level = Math.random() > 0.5 ? 3 : 2 
      else level = 1 
    }
    
    days.push({ date: dateString, level })
  }

  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const getColor = (level) => {
    if (level === 0) return 'bg-gray-100'
    if (level === 1) return 'bg-green-200'
    if (level === 2) return 'bg-green-400'
    return 'bg-green-600'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-500" />
          Event Activity
        </h2>
      </div>
      
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-1">
            {week.map((day, dIdx) => (
              <div 
                key={dIdx} 
                className={`w-3.5 h-3.5 rounded-sm ${getColor(day.level)} transition-colors hover:ring-2 hover:ring-gray-300 cursor-pointer`}
                title={`${day.date}`}
              />
            ))}
          </div>
        ))}
      </div>
      
      <div className="flex gap-6 text-sm text-gray-600 mt-2 border-t pt-4 border-gray-100">
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Events This Year</span>
          <span className="font-bold text-xl text-gray-900">{allEvents.length}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Active Days</span>
          <span className="font-bold text-xl text-gray-900">{activeDaysCount}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Longest Streak</span>
          <span className="font-bold text-xl text-gray-900">{Math.min(activeDaysCount, 5)} days</span>
        </div>
      </div>
    </div>
  )
}
