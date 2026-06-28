import React, { useState, useEffect } from 'react'
import { X, KeyRound, Shield, CheckCircle2, Sparkles, Loader2 } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { googleConnected, geminiConfigured, googleUserEmail, checkAuth } = useAuth()

  const [geminiKey, setGeminiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setGeminiKey('')
      setMessage(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleGoogleConnect = async () => {
    setConnecting(true)
    setMessage(null)
    try {
      const response = await api.get('/auth/google')
      if (response.data && response.data.url) {
        window.location.replace(response.data.url)
      } else {
        throw new Error('Google authorization URL not returned.')
      }
    } catch (err: any) {
      console.error('Failed to initiate Google OAuth:', err)
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to initiate Google Calendar connection.',
      })
    } finally {
      setConnecting(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    let keyToSave = geminiKey.trim()
    if (keyToSave) {
      keyToSave = 'AIzaSy' + keyToSave
    }

    try {
      await api.patch('/auth/config', { geminiApiKey: keyToSave })
      await checkAuth()
      setMessage({ type: 'success', text: 'Settings saved successfully.' })
      setGeminiKey('')
    } catch (err: any) {
      console.error('Failed to save settings:', err)
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save configuration settings.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/10 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="
            relative w-full max-w-md rounded-none
            bg-white/95 border border-white/60
            p-8
            backdrop-blur-md space-y-6
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-lora text-xl font-medium text-ink flex items-center gap-2">
              <Shield size={18} className="text-horizon" />
              Workspace Settings
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-charcoal/50 hover:text-ink hover:bg-paper-border/30 rounded-none transition-colors"
              aria-label="Close settings"
            >
              <X size={18} />
            </button>
          </div>

          <hr className="border-paper-border/60" />

          {/* Form */}
          <form onSubmit={handleSaveSettings} className="space-y-5">
            {/* Google OAuth Section */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 font-jakarta">
                Google Calendar Integration
              </label>

              <button
                type="button"
                onClick={handleGoogleConnect}
                disabled={connecting || googleConnected}
                className={`
                  w-full flex items-center justify-center gap-2.5
                  rounded-none border px-4 py-3
                  font-jakarta text-sm font-medium
                  transition-all duration-300
                  ${
                    googleConnected
                      ? 'border-sage/40 bg-sage/5 text-sage cursor-default'
                      : 'border-paper-border bg-white text-ink hover:bg-card-linen hover:border-charcoal/30 hover:-translate-y-px active:translate-y-0 disabled:opacity-50'
                  }
                `}
              >
                {connecting ? (
                  <Loader2 size={16} className="animate-spin text-horizon" />
                ) : googleConnected ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                {googleConnected
                  ? `Connected: ${googleUserEmail || 'Active'}`
                  : connecting
                  ? 'Initiating Google Connection...'
                  : 'Connect Google Calendar'}
              </button>
            </div>

            {/* Gemini API Key Section */}
            <div className="space-y-2">
              <label htmlFor="settings-gemini-key" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-charcoal/60 font-jakarta">
                <KeyRound size={12} className="text-terracotta" />
                Gemini API Key
                {geminiConfigured && (
                  <span className="text-[10px] text-sage font-medium lowercase tracking-normal">
                    (configured)
                  </span>
                )}
              </label>

              <input
                id="settings-gemini-key"
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder={geminiConfigured ? '••••••••••••••••' : 'AIzaSy…'}
                autoComplete="off"
                className="
                  w-full rounded-none border border-paper-border bg-white px-4 py-3
                  font-jakarta text-sm text-ink placeholder-charcoal/40
                  outline-none transition-all duration-200
                  focus:ring-1 focus:ring-horizon/30 focus:border-horizon
                "
              />
            </div>

            {/* Alerts/Status Message */}
            {message && (
              <div
                className={`
                  rounded-none border px-4 py-3 text-xs font-jakarta font-medium
                  ${
                    message.type === 'success'
                      ? 'bg-sage/8 border-sage/20 text-sage'
                      : 'bg-terracotta/8 border-terracotta/20 text-terracotta'
                  }
                `}
              >
                {message.text}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="
                  px-4 py-2.5 rounded-none
                  font-jakarta text-xs font-medium text-charcoal
                  transition-colors hover:bg-paper-border/30
                "
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !geminiKey.trim()}
                className="
                  flex items-center gap-1.5 px-5 py-2.5 rounded-none
                  bg-ink text-white font-jakarta text-xs font-semibold
                  transition-all duration-300
                  hover:bg-ink/90 hover:-translate-y-px
                  active:translate-y-0
                  disabled:opacity-50 disabled:pointer-events-none
                "
              >
                {saving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
