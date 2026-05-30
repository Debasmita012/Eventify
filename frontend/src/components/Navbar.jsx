import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const loc = useLocation()
  const name = localStorage.getItem('user_name') || 'Student'
  const role = localStorage.getItem('user_role') || 'student'

  const links = [
    { path: '/feed',         label: '🏠 Feed'     },
    { path: '/dashboard',    label: '📊 Dashboard' },
    { path: '/explore',      label: '🌐 Explore'  },
    { path: '/leaderboard',  label: '🏆 Board'    },
    { path: '/certificates', label: '🏅 Certs'    },
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
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <span onClick={() => navigate('/feed')}
          className="font-bold text-indigo-600 text-lg cursor-pointer select-none">
          ⚡ Eventify
        </span>
        <div className="flex items-center gap-1 sm:gap-3">
          {links.map(l => (
            <button key={l.path} onClick={() => navigate(l.path)}
              className={`text-xs sm:text-sm font-medium px-2 py-1 rounded-lg transition
                ${loc.pathname === l.path
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
              {l.label}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center
              justify-center text-sm font-semibold text-indigo-700 cursor-pointer"
              onClick={() => navigate('/portfolio')}>
              {name[0]?.toUpperCase()}
            </div>
            <button onClick={logout}
              className="text-xs text-gray-400 hover:text-red-400 transition">
              out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
