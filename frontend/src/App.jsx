import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import Feed from './pages/Feed'
import EventDetail from './pages/EventDetail'
import OrganizerPortal from './pages/OrganizerPortal'
import OrganizerSignup from './pages/OrganizerSignup'
import EventAnalytics from './pages/EventAnalytics'
import EventOperations from './pages/EventOperations'
import StudentDashboard from './pages/StudentDashboard'
import Portfolio from './pages/Portfolio'
import Leaderboard from './pages/Leaderboard'
import MapView from './pages/MapView'
import ExploreExternal from './pages/ExploreExternal'
import CertificateVault from './pages/CertificateVault'
import AdminPanel from './pages/AdminPanel'
import Navbar from './components/Navbar'

function RequireAuth({ children }) {
  const userId = localStorage.getItem('user_id')
  return userId ? children : <Navigate to="/onboard" />
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-transparent">
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
        <Route path="/organizer-signup" element={<OrganizerSignup />} />
        <Route path="/feed" element={<RequireAuth><Layout><Feed /></Layout></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><Layout><StudentDashboard /></Layout></RequireAuth>} />
        <Route path="/event/:id" element={<RequireAuth><Layout><EventDetail /></Layout></RequireAuth>} />
        <Route path="/organizer" element={<RequireAuth><Layout><OrganizerPortal /></Layout></RequireAuth>} />
        <Route path="/operations/:id" element={<RequireAuth><Layout><EventOperations /></Layout></RequireAuth>} />
        <Route path="/analytics/:id" element={<RequireAuth><Layout><EventAnalytics /></Layout></RequireAuth>} />
        <Route path="/portfolio" element={<RequireAuth><Layout><Portfolio /></Layout></RequireAuth>} />
        <Route path="/leaderboard" element={<RequireAuth><Layout><Leaderboard /></Layout></RequireAuth>} />
        <Route path="/map" element={<RequireAuth><Layout><MapView /></Layout></RequireAuth>} />
        <Route path="/explore" element={<RequireAuth><Layout><ExploreExternal /></Layout></RequireAuth>} />
        <Route path="/certificates" element={<RequireAuth><Layout><CertificateVault /></Layout></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth><Layout><AdminPanel /></Layout></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}
