import { useState, useEffect, useCallback } from 'react'
import './index.css'
import Gateway from './pages/Gateway'
import Dashboard from './pages/Dashboard'

/* ──────────────────────────────────────────────────────────
   App.tsx — Root component with auth-based routing
   Gateway ↔ Dashboard, driven by auth status check.
   ────────────────────────────────────────────────────────── */

const API_BASE = 'http://localhost:3000/api/auth'

type AppView = 'loading' | 'gateway' | 'dashboard'

function App() {
  const [view, setView] = useState<AppView>('loading')

  // ── Check auth on mount ──────────────────────────────────
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('bearer_token')
    if (!token) {
      setView('gateway')
      return
    }
    try {
      const res = await fetch(`${API_BASE}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setView(data.isAuthenticated ? 'dashboard' : 'gateway')
      } else {
        setView('gateway')
      }
    } catch {
      // Backend offline — if token exists, show dashboard with mock data
      setView(token ? 'dashboard' : 'gateway')
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // ── Handle lock: clear token, go back to Gateway ─────────
  const handleLock = useCallback(() => {
    localStorage.removeItem('bearer_token')
    setView('gateway')
  }, [])

  // ── Loading spinner ──────────────────────────────────────
  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-paper-border border-t-sage animate-spin" />
      </div>
    )
  }

  // ── Route ────────────────────────────────────────────────
  if (view === 'dashboard') {
    return <Dashboard onLock={handleLock} />
  }

  return <Gateway />
}

export default App
