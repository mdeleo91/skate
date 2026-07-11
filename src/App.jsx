import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Layout from './components/Layout'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SkateStart from './pages/SkateStart'
import LiveSkate from './pages/LiveSkate'
import History from './pages/History'
import Programs from './pages/Programs'
import Nutrition from './pages/Nutrition'
import Weight from './pages/Weight'
import Photos from './pages/Photos'
import CalendarPage from './pages/CalendarPage'
import Achievements from './pages/Achievements'
import Challenges from './pages/Challenges'
import Gear from './pages/Gear'
import Stats from './pages/Stats'
import RoutesPage from './pages/RoutesPage'
import Weather from './pages/Weather'
import Profile from './pages/Profile'
import Progress from './pages/Progress'
import More from './pages/More'

function Splash() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-volt-500 text-ink-900 font-display text-2xl font-bold shadow-glow live-dot">S</div>
        <div className="text-sm text-slate-400">Lacing up…</div>
      </div>
    </div>
  )
}

function Protected({ children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return (
    <DataProvider>
      <Layout>{children}</Layout>
    </DataProvider>
  )
}

function LiveShell() {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  return (
    <DataProvider>
      <LiveSkate />
    </DataProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/live" element={<LiveShell />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/skate" element={<Protected><SkateStart /></Protected>} />
        <Route path="/history" element={<Protected><History /></Protected>} />
        <Route path="/programs" element={<Protected><Programs /></Protected>} />
        <Route path="/nutrition" element={<Protected><Nutrition /></Protected>} />
        <Route path="/weight" element={<Protected><Weight /></Protected>} />
        <Route path="/photos" element={<Protected><Photos /></Protected>} />
        <Route path="/calendar" element={<Protected><CalendarPage /></Protected>} />
        <Route path="/achievements" element={<Protected><Achievements /></Protected>} />
        <Route path="/challenges" element={<Protected><Challenges /></Protected>} />
        <Route path="/gear" element={<Protected><Gear /></Protected>} />
        <Route path="/stats" element={<Protected><Stats /></Protected>} />
        <Route path="/routes" element={<Protected><RoutesPage /></Protected>} />
        <Route path="/weather" element={<Protected><Weather /></Protected>} />
        <Route path="/progress" element={<Protected><Progress /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/more" element={<Protected><More /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
