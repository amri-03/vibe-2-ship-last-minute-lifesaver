import React, { createContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export interface AuthContextType {
  isAuthenticated: boolean
  setupCompleted: boolean
  googleConnected: boolean
  geminiConfigured: boolean
  googleUserEmail: string | null
  userEmail: string | null
  loading: boolean
  error: string | null
  checkAuth: () => Promise<void>
  setup: (password: string, geminiKey?: string) => Promise<void>
  login: (password: string) => Promise<void>
  register: (email: string, password: string, geminiApiKey?: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [setupCompleted, setSetupCompleted] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [geminiConfigured, setGeminiConfigured] = useState(false)
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkAuth = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/auth/status')
      setIsAuthenticated(res.data.isAuthenticated || false)
      setGoogleConnected(res.data.googleConnected || false)
      setGeminiConfigured(res.data.geminiConfigured || false)
      setGoogleUserEmail(res.data.user?.googleUserEmail || null)
      setUserEmail(res.data.user?.email || null)
      setSetupCompleted(res.data.setupCompleted !== undefined ? res.data.setupCompleted : true)
    } catch (err: any) {
      console.error('checkAuth failed:', err)
      setError(err.response?.data?.message || 'Failed to authenticate.')
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (password: string) => {
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { masterPassword: password })
      if (res.data.success) {
        if (res.data.token) {
          localStorage.setItem('bearer_token', res.data.token)
        }
        setIsAuthenticated(true)
        await checkAuth()
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed.'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [checkAuth])

  const register = useCallback(async (email: string, password: string, geminiApiKey?: string) => {
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/auth/register', { email, password, geminiApiKey })
      if (res.data.success) {
        setIsAuthenticated(true)
        await checkAuth()
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed.'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [checkAuth])

  const setup = useCallback(async (password: string, geminiKey?: string) => {
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/auth/setup', { masterPassword: password, geminiApiKey: geminiKey })
      if (res.data.success) {
        if (res.data.token) {
          localStorage.setItem('bearer_token', res.data.token)
        }
        setIsAuthenticated(true)
        setSetupCompleted(true)
        await checkAuth()
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Setup failed.'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [checkAuth])

  const logout = useCallback(() => {
    localStorage.removeItem('bearer_token')
    setIsAuthenticated(false)
    setGoogleConnected(false)
    setGeminiConfigured(false)
    setGoogleUserEmail(null)
    setUserEmail(null)
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
        userEmail,
        loading,
        error,
        checkAuth,
        setup,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
