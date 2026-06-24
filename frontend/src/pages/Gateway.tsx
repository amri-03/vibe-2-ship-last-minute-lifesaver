import { useState, useEffect, useCallback } from 'react'
import {
  Eye,
  EyeOff,
  Shield,
  Sparkles,
  KeyRound,
  ArrowRight,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

/* ──────────────────────────────────────────────────────────
   Gateway.tsx — Onboarding & Lock Screen
   States:
     A) First-Time Setup  (setupCompleted === false)
     B) Lock Screen       (setupCompleted === true, !isAuthenticated)
   ────────────────────────────────────────────────────────── */

// ── Validation helpers ─────────────────────────────────────

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters'
  return null
}

function validateGeminiKey(key: string): string | null {
  if (key.length === 0) return null // optional field
  if (!key.startsWith('AIzaSy')) return 'Gemini API key must start with "AIzaSy"'
  return null
}

// ── Inline sub-components ──────────────────────────────────

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  error,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  error: string | null
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={`
            w-full rounded-lg border bg-white/60 px-4 py-3 pr-12
            font-jakarta text-sm text-ink placeholder-charcoal/50
            outline-none transition-all duration-200
            focus:ring-2 focus:ring-horizon/30 focus:border-horizon
            ${error ? 'border-terracotta/60' : 'border-paper-border'}
          `}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/60 hover:text-ink transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-terracotta font-jakarta">
          <AlertCircle size={13} />
          {error}
        </p>
      )}
    </div>
  )
}

function FormLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-ink font-jakarta mb-1.5">
      {children}
    </label>
  )
}

// ── Main Gateway Component ─────────────────────────────────

export default function Gateway() {
  const {
    setupCompleted,
    isAuthenticated,
    loading,
    error,
    login,
    setup,
    googleConnected,
  } = useAuth()

  // ── Form state ───────────────────────────────────────────
  const [masterPassword, setMasterPassword] = useState('')
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // ── Touched state (show errors only after interaction) ───
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [geminiTouched, setGeminiTouched] = useState(false)

  // Sync contextual errors to form errors
  useEffect(() => {
    if (error) {
      setFormError(error)
    }
  }, [error])

  // ── Derived validation ───────────────────────────────────
  const passwordError = passwordTouched ? validatePassword(masterPassword) : null
  const geminiError = geminiTouched ? validateGeminiKey(geminiApiKey) : null

  const isSetupValid =
    validatePassword(masterPassword) === null &&
    validateGeminiKey(geminiApiKey) === null

  const isLoginValid = validatePassword(masterPassword) === null

  // ── Handlers ─────────────────────────────────────────────
  const handleGoogleConnect = useCallback(() => {
    window.location.href = 'http://localhost:3000/api/auth/google'
  }, [])

  const handleSetup = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setPasswordTouched(true)
      setGeminiTouched(true)
      if (!isSetupValid) return

      setSubmitting(true)
      setFormError(null)
      try {
        await setup(masterPassword, geminiApiKey)
      } catch (err: any) {
        setFormError(err.message || 'Setup failed. Please try again.')
      } finally {
        setSubmitting(false)
      }
    },
    [masterPassword, geminiApiKey, isSetupValid, setup],
  )

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setPasswordTouched(true)
      if (!isLoginValid) return

      setSubmitting(true)
      setFormError(null)
      try {
        await login(masterPassword)
      } catch (err: any) {
        setFormError(err.message || 'Login failed. Please try again.')
      } finally {
        setSubmitting(false)
      }
    },
    [masterPassword, isLoginValid, login],
  )

  // ── Loading state ────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-horizon" />
      </div>
    )
  }

  // ── Authenticated redirect placeholder ───────────────────
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center space-y-4">
          <CheckCircle2 size={48} className="mx-auto text-sage" />
          <h2 className="font-lora text-2xl font-medium text-ink">Welcome Back</h2>
          <p className="font-jakarta text-sm text-charcoal">
            Redirecting to your dashboard…
          </p>
        </div>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-12">
      {/* Subtle background texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 0.5px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── Glassmorphic Card ─────────────────────────────── */}
      <div
        className="
          relative z-10 max-w-md w-full
          bg-white/40 border border-white/60
          p-10 rounded-xl
          shadow-[0_8px_32px_rgba(28,25,23,0.04)]
          backdrop-blur-md
        "
      >
        {!setupCompleted ? (
          /* ════════════════════════════════════════════════
             STATE A — First-Time Onboarding
             ════════════════════════════════════════════════ */
          <form onSubmit={handleSetup} className="space-y-6">
            {/* Brand header */}
            <div className="text-center space-y-2 mb-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sage/10 mb-3">
                <Sparkles size={22} className="text-sage" />
              </div>
              <h1 className="font-lora text-3xl font-medium tracking-tight text-ink">
                LIFE SAVER
              </h1>
              <p className="font-jakarta text-sm text-charcoal leading-relaxed">
                Set up your workspace to get started with your
                <br />
                proactive AI productivity companion.
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-paper-border" />

            {/* Master Password */}
            <div>
              <FormLabel htmlFor="setup-password">
                <span className="flex items-center gap-1.5">
                  <Shield size={14} className="text-horizon" />
                  Master Password
                </span>
              </FormLabel>
              <PasswordInput
                id="setup-password"
                value={masterPassword}
                onChange={(v) => {
                  setMasterPassword(v)
                  setPasswordTouched(true)
                }}
                placeholder="Minimum 8 characters"
                error={passwordError}
              />
            </div>

            {/* Google OAuth */}
            <div>
              <FormLabel htmlFor="google-connect">
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" aria-hidden="true">
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
                  Connect Google Calendar
                </span>
              </FormLabel>
              <button
                id="google-connect"
                type="button"
                onClick={handleGoogleConnect}
                className={`
                  w-full flex items-center justify-center gap-2.5
                  rounded-lg border px-4 py-3
                  font-jakarta text-sm font-medium
                  transition-all duration-300
                  ${
                    googleConnected
                      ? 'border-sage/40 bg-sage/5 text-sage cursor-default'
                      : 'border-paper-border bg-white/70 text-ink hover:bg-white hover:border-charcoal/30 hover:-translate-y-px hover:shadow-sm active:translate-y-0'
                  }
                `}
                disabled={googleConnected}
              >
                {googleConnected ? (
                  <>
                    <CheckCircle2 size={16} />
                    Google Calendar Connected
                  </>
                ) : (
                  <>
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
                    Sign in with Google
                  </>
                )}
              </button>
            </div>

            {/* Gemini API Key */}
            <div>
              <FormLabel htmlFor="gemini-key">
                <span className="flex items-center gap-1.5">
                  <KeyRound size={14} className="text-terracotta" />
                  Gemini API Key
                  <span className="text-xs text-charcoal/60 font-normal">(optional)</span>
                </span>
              </FormLabel>
              <div className="space-y-1.5">
                <input
                  id="gemini-key"
                  type="text"
                  value={geminiApiKey}
                  onChange={(e) => {
                    setGeminiApiKey(e.target.value)
                    setGeminiTouched(true)
                  }}
                  placeholder="AIzaSy…"
                  autoComplete="off"
                  className={`
                    w-full rounded-lg border bg-white/60 px-4 py-3
                    font-jakarta text-sm text-ink placeholder-charcoal/50
                    outline-none transition-all duration-200
                    focus:ring-2 focus:ring-horizon/30 focus:border-horizon
                    ${geminiError ? 'border-terracotta/60' : 'border-paper-border'}
                  `}
                />
                {geminiError && (
                  <p className="flex items-center gap-1.5 text-xs text-terracotta font-jakarta">
                    <AlertCircle size={13} />
                    {geminiError}
                  </p>
                )}
              </div>
            </div>

            {/* Form-level error */}
            {formError && (
              <div className="rounded-lg bg-terracotta/8 border border-terracotta/20 px-4 py-3">
                <p className="flex items-center gap-2 text-sm text-terracotta font-jakarta">
                  <AlertCircle size={15} />
                  {formError}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="
                w-full flex items-center justify-center gap-2
                rounded-lg bg-ink px-4 py-3.5
                font-jakarta text-sm font-semibold text-white
                transition-all duration-300
                hover:bg-ink/90 hover:-translate-y-px hover:shadow-md
                active:translate-y-0 active:shadow-sm
                disabled:opacity-50 disabled:pointer-events-none
              "
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Initialize Workspace
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* ════════════════════════════════════════════════
             STATE B — Lock Screen
             ════════════════════════════════════════════════ */
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Brand header */}
            <div className="text-center space-y-2 mb-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-horizon/10 mb-3">
                <Lock size={22} className="text-horizon" />
              </div>
              <h1 className="font-lora text-3xl font-medium tracking-tight text-ink">
                LIFE SAVER
              </h1>
              <p className="font-jakarta text-xs font-medium uppercase tracking-widest text-charcoal/70">
                Locked
              </p>
              <p className="font-jakarta text-sm text-charcoal leading-relaxed pt-1">
                Enter your master password to unlock your workspace.
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-paper-border" />

            {/* Master Password */}
            <div>
              <FormLabel htmlFor="login-password">
                <span className="flex items-center gap-1.5">
                  <Shield size={14} className="text-horizon" />
                  Master Password
                </span>
              </FormLabel>
              <PasswordInput
                id="login-password"
                value={masterPassword}
                onChange={(v) => {
                  setMasterPassword(v)
                  setPasswordTouched(true)
                }}
                placeholder="Enter your password"
                error={passwordError}
              />
            </div>

            {/* Form-level error */}
            {formError && (
              <div className="rounded-lg bg-terracotta/8 border border-terracotta/20 px-4 py-3">
                <p className="flex items-center gap-2 text-sm text-terracotta font-jakarta">
                  <AlertCircle size={15} />
                  {formError}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="
                w-full flex items-center justify-center gap-2
                rounded-lg bg-ink px-4 py-3.5
                font-jakarta text-sm font-semibold text-white
                transition-all duration-300
                hover:bg-ink/90 hover:-translate-y-px hover:shadow-md
                active:translate-y-0 active:shadow-sm
                disabled:opacity-50 disabled:pointer-events-none
              "
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Unlock Workspace
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-charcoal/50 font-jakarta">
          Your data is encrypted and stored locally.
        </p>
      </div>
    </div>
  )
}
