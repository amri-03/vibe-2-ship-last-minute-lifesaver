import React, { createContext, useState } from 'react'

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
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated] = useState(false)
  const [setupCompleted] = useState(false)
  const [googleConnected] = useState(false)
  const [geminiConfigured] = useState(false)
  const [googleUserEmail] = useState<string | null>(null)
  const [userEmail] = useState<string | null>(null)
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)

  const checkAuth = async () => {
    console.log('checkAuth stub')
  }

  const setup = async (password: string, geminiKey?: string) => {
    console.log('setup stub', password, geminiKey)
  }

  const login = async (password: string) => {
    console.log('login stub', password)
  }

  const register = async (email: string, password: string) => {
    console.log('register stub', email, password)
  }

  const logout = () => {
    console.log('logout stub')
  }

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
