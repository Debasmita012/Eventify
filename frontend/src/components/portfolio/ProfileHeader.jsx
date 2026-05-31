import React from 'react'
import { Award, Mail, BookOpen, Calendar, Zap, Ticket } from 'lucide-react'

export default function ProfileHeader({ user, totalEvents, totalCertificates, badgesEarned, totalPoints }) {
  return (
    <div className="mc-panel p-8 mb-8 flex flex-col lg:flex-row gap-8 items-center lg:items-start relative overflow-hidden">

      {/* Left side: Avatar & Info */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 flex-1 relative z-10 w-full">
        <div className="relative group">
          <div className="w-28 h-28 bg-white border-4 border-slate-300 overflow-hidden relative z-10 shadow-sm">
            <div className="w-full h-full overflow-hidden bg-white">
              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}&backgroundColor=ffffff&textColor=333333`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-green-500 border-2 border-green-700 text-white text-[10px] font-bold px-2 py-1 z-20 shadow-sm border-b-4 border-r-4">
            LVL {Math.floor(totalPoints / 100) + 1}
          </div>
        </div>
        
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-vt text-slate-800 tracking-wider text-shadow-sm mb-1">{user?.name || 'Explorer'}</h1>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Registered Agent</div>
          
          <div className="flex flex-wrap gap-y-3 gap-x-5 justify-center sm:justify-start text-xs font-outfit text-slate-600 font-bold">
            <span className="flex items-center gap-2 bg-slate-100 border-2 border-slate-300 border-b-4 px-3 py-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {user?.email || 'unknown@nexus.sys'}</span>
            <span className="flex items-center gap-2 bg-slate-100 border-2 border-slate-300 border-b-4 px-3 py-1.5"><BookOpen className="w-3.5 h-3.5 text-slate-500" /> {user?.department || 'Undeclared'}</span>
            <span className="flex items-center gap-2 bg-slate-100 border-2 border-slate-300 border-b-4 px-3 py-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500" /> Cycle 26</span>
          </div>
        </div>
      </div>

      {/* Right side: Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto relative z-10 shrink-0">
        <div className="bg-white border-2 border-slate-300 border-b-4 p-4 text-center hover:bg-slate-50 transition-colors group">
          <img src="/theme-assets/owl.png" alt="Owl" className="w-8 h-8 mx-auto mb-2 object-contain group-hover:scale-110 transition-transform mix-blend-multiply" />
          <div className="text-2xl font-black text-slate-800 font-outfit">{totalEvents}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Events</div>
        </div>
        <div className="bg-white border-2 border-slate-300 border-b-4 p-4 text-center hover:bg-slate-50 transition-colors group">
          <img src="/theme-assets/potion.png" alt="Potion" className="w-8 h-8 mx-auto mb-2 object-contain group-hover:scale-110 transition-transform mix-blend-multiply" />
          <div className="text-2xl font-black text-slate-800 font-outfit">{totalCertificates}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Certs</div>
        </div>
        <div className="bg-white border-2 border-slate-300 border-b-4 p-4 text-center hover:bg-slate-50 transition-colors group">
          <img src="/theme-assets/wand.png" alt="Wand" className="w-8 h-8 mx-auto mb-2 object-contain group-hover:scale-110 transition-transform mix-blend-multiply" />
          <div className="text-2xl font-black text-slate-800 font-outfit">{badgesEarned}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Badges</div>
        </div>
        <div className="bg-green-50 border-2 border-green-300 border-b-4 p-4 text-center hover:bg-green-100 transition-colors group relative overflow-hidden">
          <img src="/theme-assets/chest.png" alt="Chest" className="w-10 h-10 mx-auto mb-2 object-contain group-hover:scale-110 transition-transform relative z-10 mix-blend-multiply" />
          <div className="text-2xl font-black text-slate-800 font-outfit relative z-10">{totalPoints}</div>
          <div className="text-[10px] text-green-700 font-bold uppercase tracking-widest mt-1 relative z-10">XP</div>
        </div>
      </div>
    </div>
  )
}
