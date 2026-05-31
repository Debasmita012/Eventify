import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const loc = useLocation()
  const name = localStorage.getItem('user_name') || 'Student'
  const role = localStorage.getItem('user_role') || 'student'

  const links = [
    { path: '/feed',         label: '🏠 Feed'     },
    { path: '/explore',      label: '🌐 Explore'  },
    { path: '/leaderboard',  label: '🏆 Board'    },
    { path: '/certificates', label: '🏅 Certs'    },
    { path: '/graph',        label: '🕸️ Graph'    },
    { path: '/portfolio',    label: '📁 Portfolio' },
    { path: '/map',          label: '🗺 Map'       },
    ...(role === 'organizer' || role === 'admin'
      ? [{ path: '/organizer', label: '📋 Organizer' },
         { path: '/admin',     label: '🛡️ Admin'     }]
      : []),
  ]

  const logout = () => {
    localStorage.clear()
    navigate('/onboard')
  }

  return (
    <div className="sticky top-4 z-40 px-4 sm:px-6 w-full max-w-7xl mx-auto">
      <nav className="mc-panel rounded-none px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/feed')}>
          <img src="/theme-assets/logo.png" alt="Eventify Logo" className="h-10 object-contain hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end font-outfit">
          {links.map(l => (
            <button key={l.path} onClick={() => navigate(l.path)}
              className={`text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-none transition-all duration-300 uppercase tracking-wider
                ${loc.pathname === l.path
                  ? 'mc-btn'
                  : 'text-slate-600 hover:text-slate-900 border-2 border-transparent hover:border-slate-300 hover:bg-slate-100'}`}>
              {l.label}
            </button>
          ))}

          <div className="flex items-center gap-3 ml-2 sm:ml-4 border-l-4 border-slate-300 pl-3 sm:pl-5">
            <div className="w-8 h-8 rounded-none bg-green-500 border-2 border-green-700 border-b-4 border-r-4 border-b-green-800 border-r-green-800 flex items-center
              justify-center text-xs font-bold text-white cursor-pointer hover:-translate-y-1 transition-all shadow-sm"
              onClick={() => navigate('/portfolio')}>
              {name[0]?.toUpperCase()}
            </div>
            <button onClick={logout}
              className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-red-500 transition-colors">
              Out
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
