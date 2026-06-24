import React, { createContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

interface AuthContextType {
  isAuthenticated: boolean
  setupCompleted: boolean
  googleConnected: boolean
  geminiConfigured: boolean
  googleUserEmail: string | null
  loading: boolean
  error: string | null
  checkAuth: () => Promise<void>
  setup: (password: string, geminiKey?: string) => Promise<void>
  login: (password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [setupCompleted, setSetupCompleted] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [geminiConfigured, setGeminiConfigured] = useState(false)
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('bearer_token')
    if (!token) {
      setIsAuthenticated(false)
      // Fetch status without token to see if setupCompleted
      try {
        const res = await api.get('/auth/status')
        setSetupCompleted(res.data.setupCompleted)
        setGoogleConnected(res.data.googleConnected || false)
        setGeminiConfigured(res.data.geminiConfigured || false)
        setGoogleUserEmail(res.data.googleUserEmail || null)
      } catch {
        setSetupCompleted(false)
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      const res = await api.get('/auth/status')
      setSetupCompleted(res.data.setupCompleted)
      setIsAuthenticated(res.data.isAuthenticated)
      setGoogleConnected(res.data.googleConnected)
      setGeminiConfigured(res.data.geminiConfigured)
      setGoogleUserEmail(res.data.googleUserEmail)
    } catch (err) {
      // Backend offline or error — keep local state or reset
      console.error('checkAuth failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (password: string) => {
    setError(null)
    try {
      const res = await api.post('/auth/login', { masterPassword: password })
      if (res.data.success && res.data.token) {
        localStorage.setItem('bearer_token', res.data.token)
        setIsAuthenticated(true)
        await checkAuth()
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.'
      setError(msg)
      throw new Error(msg)
    }
  }, [checkAuth])

  const setup = useCallback(async (password: string, geminiKey?: string) => {
    setError(null)
    try {
      const res = await api.post('/auth/setup', {
        masterPassword: password,
        geminiApiKey: geminiKey || undefined,
      })
      if (res.data.success && res.data.token) {
        localStorage.setItem('bearer_token', res.data.token)
        setIsAuthenticated(true)
        setSetupCompleted(true)
        await checkAuth()
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Setup failed. Please try again.'
      setError(msg)
      throw new Error(msg)
    }
  }, [checkAuth])

  const logout = useCallback(() => {
    localStorage.removeItem('bearer_token')
    setIsAuthenticated(false)
    setGoogleConnected(false)
    setGeminiConfigured(false)
    setGoogleUserEmail(null)
  }, [])

  // Listen to response interceptor unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [logout])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setupCompleted,
        googleConnected,
        geminiConfigured,
        googleUserEmail,
        loading,
        error,
        checkAuth,
        setup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
