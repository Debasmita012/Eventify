import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import Feed from './pages/Feed'
import EventDetail from './pages/EventDetail'
import OrganizerPortal from './pages/OrganizerPortal'
import Analytics from './pages/Analytics'
import Portfolio from './pages/Portfolio'
import Leaderboard from './pages/Leaderboard'
import MapView from './pages/MapView'
import Navbar from './components/Navbar'

function RequireAuth({ children }) {
  const userId = localStorage.getItem('user_id')
  return userId ? children : <Navigate to="/onboard" />
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
    </div>
  )
}

export default function App() {
  const userId = localStorage.getItem('user_id')
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={userId ? "/feed" : "/onboard"} />} />
        <Route path="/onboard" element={<Onboarding />} />
        <Route path="/feed" element={<RequireAuth><Layout><Feed /></Layout></RequireAuth>} />
        <Route path="/event/:id" element={<RequireAuth><Layout><EventDetail /></Layout></RequireAuth>} />
        <Route path="/organizer" element={<RequireAuth><Layout><OrganizerPortal /></Layout></RequireAuth>} />
        <Route path="/analytics/:id" element={<RequireAuth><Layout><Analytics /></Layout></RequireAuth>} />
        <Route path="/portfolio" element={<RequireAuth><Layout><Portfolio /></Layout></RequireAuth>} />
        <Route path="/leaderboard" element={<RequireAuth><Layout><Leaderboard /></Layout></RequireAuth>} />
        <Route path="/map" element={<RequireAuth><Layout><MapView /></Layout></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}
