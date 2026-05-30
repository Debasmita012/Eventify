import { useState, useEffect } from 'react'
import axios from 'axios'
import API from '../config'
const MEDALS = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const [data, setData] = useState([])
  // userId unused

  useEffect(() => {
    axios.get(`${API}/leaderboard`).then(r => setData(r.data))
  }, [])

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🏆</div>
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Earn points by RSVPing (+20) and bookmarking (+5) events
        </p>
      </div>

      <div className="space-y-3">
        {data.map((student, i) => (
          <div key={i}
            className={`bg-white rounded-2xl border p-4 flex items-center gap-4
              ${i === 0 ? 'border-yellow-300 shadow-sm' : 'border-gray-100'}`}>
            <div className="text-2xl w-8 text-center">
              {MEDALS[i] || <span className="text-gray-400 text-sm font-medium">#{i + 1}</span>}
            </div>
            <img src={`https://i.pravatar.cc/36?u=${i + 99}`}
              className="w-9 h-9 rounded-full" />
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-900">{student.name}</div>
              <div className="text-xs text-gray-400">{student.department}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-indigo-600">{student.points}</div>
              <div className="text-xs text-gray-400">pts</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-indigo-50 rounded-2xl p-4 text-center">
        <p className="text-sm text-indigo-700 font-medium">
          RSVP to events to earn points and climb the board!
        </p>
      </div>
    </div>
  )
}
