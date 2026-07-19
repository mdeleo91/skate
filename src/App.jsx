import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Layout from './components/Layout'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SkateStart from './pages/SkateStart'
import LiveSkate from './pages/LiveSkate'
import SkateDetail from './pages/SkateDetail'
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
import Trails from './pages/Trails'
import TrailDetail from './pages/TrailDetail'
import Weather from './pages/Weather'
import Profile from './pages/Profile'
import Progress from './pages/Progress'
import More from './pages/More'

function Splash() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <img src="/brand-icon.svg" alt="" className="h-16 w-16 live-dot" />
        <div className="text-sm text-slate-400">Lacing up…</div>
      </div>
    </div>
  )
}

// Auth gate with the app chrome (header + nav).
function Protected({ children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return <Layout>{children}</Layout>
}

// Auth gate without chrome, for immersive full-screen views (live skate, session detail).
function FullScreen({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      {/* One DataProvider for the whole app. When each route had its own,
          state written right before navigation (e.g. saving a live skate,
          which unmounted /live's provider) could be dropped before it was
          persisted — live sessions silently vanished. */}
      <DataProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/live" element={<FullScreen><LiveSkate /></FullScreen>} />
          <Route path="/session/:id" element={<FullScreen><SkateDetail /></FullScreen>} />
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
          <Route path="/trails" element={<Protected><Trails /></Protected>} />
          <Route path="/trail/:id" element={<Protected><TrailDetail /></Protected>} />
          <Route path="/weather" element={<Protected><Weather /></Protected>} />
          <Route path="/progress" element={<Protected><Progress /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/more" element={<Protected><More /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DataProvider>
    </AuthProvider>
  )
}
