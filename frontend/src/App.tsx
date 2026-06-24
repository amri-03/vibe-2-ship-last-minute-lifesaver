import './index.css'
import Gateway from './pages/Gateway'
import Dashboard from './pages/Dashboard'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'

/* ──────────────────────────────────────────────────────────
   App.tsx — Root component with auth-based routing
   Gateway ↔ Dashboard, driven by auth status check.
   ────────────────────────────────────────────────────────── */

function AppContent() {
  const { isAuthenticated, loading, logout } = useAuth()

  // ── Loading spinner ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-paper-border border-t-sage animate-spin" />
      </div>
    )
  }

  // ── Route ────────────────────────────────────────────────
  if (isAuthenticated) {
    return <Dashboard onLock={logout} />
  }

  return <Gateway />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

