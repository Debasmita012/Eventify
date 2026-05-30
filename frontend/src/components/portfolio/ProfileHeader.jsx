import React from 'react'
import { Award, Mail, BookOpen, Calendar, Zap, Ticket } from 'lucide-react'

export default function ProfileHeader({ user, totalEvents, totalCertificates, badgesEarned, totalPoints }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
      {/* Left side: Avatar & Info */}
      <div className="flex items-center gap-5 flex-1">
        <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden">
          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}&backgroundColor=0f172a`} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user?.name || 'Student'}</h1>
          <div className="flex flex-wrap gap-y-2 gap-x-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-400" /> {user?.email || 'student@college.edu'}</span>
            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-gray-400" /> {user?.department || 'Engineering'}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" /> Class of 2026</span>
          </div>
        </div>
      </div>

      {/* Right side: Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
        <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg text-center">
          <Ticket className="w-5 h-5 mx-auto text-indigo-500 mb-1" />
          <div className="text-xl font-bold text-gray-900">{totalEvents}</div>
          <div className="text-xs text-gray-500 font-medium">Events</div>
        </div>
        <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg text-center">
          <Award className="w-5 h-5 mx-auto text-blue-500 mb-1" />
          <div className="text-xl font-bold text-gray-900">{totalCertificates}</div>
          <div className="text-xs text-gray-500 font-medium">Certs</div>
        </div>
        <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg text-center">
          <Zap className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
          <div className="text-xl font-bold text-gray-900">{badgesEarned}</div>
          <div className="text-xs text-gray-500 font-medium">Badges</div>
        </div>
        <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg text-center">
          <Award className="w-5 h-5 mx-auto text-green-500 mb-1" />
          <div className="text-xl font-bold text-gray-900">{totalPoints}</div>
          <div className="text-xs text-gray-500 font-medium">Points</div>
        </div>
      </div>
    </div>
  )
}
