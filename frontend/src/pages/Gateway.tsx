import { useState, useEffect, useCallback } from 'react'
import {
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

/* ──────────────────────────────────────────────────────────
   Gateway.tsx — Onboarding & Multi-User Authentication
   Dual-State Layout: Sign In and Registration
   ────────────────────────────────────────────────────────── */

// ── Validation helpers ─────────────────────────────────────

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters'
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
    checkAuth,
  } = useAuth()

  // ── Form state ───────────────────────────────────────────
  const [email, setEmail] = useState('')
  const [masterPassword, setMasterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // ── Touched state (show errors only after interaction) ───
  const [passwordTouched, setPasswordTouched] = useState(false)

  // Initialize registration state based on setupCompleted
  useEffect(() => {
    setIsRegistering(!setupCompleted)
  }, [setupCompleted])

  // Password Hygiene: wiping password caches on mount and cleanup
  useEffect(() => {
    setMasterPassword('')
    setConfirmPassword('')
    return () => {
      setMasterPassword('')
      setConfirmPassword('')
    }
  }, [])

  // Toggle state with password hygiene clearing
  const handleToggleState = () => {
    setIsRegistering((prev) => !prev)
    setMasterPassword('')
    setConfirmPassword('')
    setPasswordTouched(false)
    setFormError(null)
  }

  // Sync contextual errors to form errors
  useEffect(() => {
    if (error) {
      setFormError(error)
    }
  }, [error])

  // ── Derived validation ───────────────────────────────────
  const passwordError = passwordTouched ? validatePassword(masterPassword) : null

  const handleSetup = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setPasswordTouched(true)

      if (!email.trim()) {
        setFormError('Email Address is required.')
        return
      }

      const pwErr = validatePassword(masterPassword)
      if (pwErr) {
        setFormError(pwErr)
        return
      }

      if (masterPassword !== confirmPassword) {
        setFormError('Passwords do not match.')
        return
      }

      setSubmitting(true)
      setFormError(null)
      try {
        await setup(masterPassword)
      } catch (err: any) {
        setFormError(err.message || 'Setup failed. Please try again.')
      } finally {
        setSubmitting(false)
      }
    },
    [email, masterPassword, confirmPassword, setup],
  )

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setPasswordTouched(true)

      if (!email.trim()) {
        setFormError('Email Address is required.')
        return
      }

      const pwErr = validatePassword(masterPassword)
      if (pwErr) {
        setFormError(pwErr)
        return
      }

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
    [email, masterPassword, login],
  )

  const handleRunDemo = useCallback(async () => {
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch('http://localhost:3000/api/auth/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        throw new Error('Failed to seed demo data.')
      }
      const data = await res.json()
      if (data.token) {
        localStorage.setItem('bearer_token', data.token)
        await checkAuth()
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to run demo.')
    } finally {
      setSubmitting(false)
    }
  }, [checkAuth])

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
          relative z-10 max-w-[480px] w-full
          bg-white/40 border border-white/60
          p-12 rounded-xl
          shadow-[0_8px_32px_rgba(28,25,23,0.04)]
          backdrop-blur-md
        "
      >
        {/* Brand header */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sage/10 mb-3">
            <Sparkles size={22} className="text-sage" />
          </div>
          <p className="font-jakarta text-sm font-semibold uppercase text-ink" style={{ letterSpacing: '0.12em' }}>
            LAST-MINUTE
          </p>
          <h1 className="font-lora text-4xl font-medium tracking-tight text-ink" style={{ letterSpacing: '0.04em' }}>
            Life Saver
          </h1>
          <p className="font-jakarta text-md text-charcoal/120 leading-relaxed tracking-[0.10em] truncate whitespace-nowrap">
            Proactive AI Productivity Companion
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-paper-border/60 mb-6" />

        {isRegistering ? (
          /* ════════════════════════════════════════════════
             Registration State
             ════════════════════════════════════════════════ */
          <form onSubmit={handleSetup} className="space-y-6">
            <div>
              <FormLabel htmlFor="email">Email Address</FormLabel>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="
                  w-full rounded-lg border border-paper-border bg-white/60 px-4 py-3
                  font-jakarta text-sm text-ink placeholder-charcoal/50
                  outline-none transition-all duration-200
                  focus:ring-2 focus:ring-horizon/30 focus:border-horizon
                "
              />
            </div>

            <div>
              <FormLabel htmlFor="setup-password">Password</FormLabel>
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

            <div>
              <FormLabel htmlFor="confirm-password">Confirm Password</FormLabel>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(v) => {
                  setConfirmPassword(v)
                }}
                placeholder="Confirm your password"
                error={null}
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
                w-full flex items-center justify-center gap-2 group
                rounded-lg bg-ink px-4 py-3.5
                font-jakarta text-sm font-semibold text-white
                transition-all duration-300 ease-in-out will-change-transform
                hover:bg-black hover:scale-[1.02] hover:-translate-y-px hover:shadow-md
                active:translate-y-0 active:scale-100 active:shadow-sm
                disabled:opacity-50 disabled:pointer-events-none
              "
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* ════════════════════════════════════════════════
             Sign In State
             ════════════════════════════════════════════════ */
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <FormLabel htmlFor="email">Email Address</FormLabel>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="
                  w-full rounded-lg border border-paper-border bg-white/60 px-4 py-3
                  font-jakarta text-sm text-ink placeholder-charcoal/50
                  outline-none transition-all duration-200
                  focus:ring-2 focus:ring-horizon/30 focus:border-horizon
                "
              />
            </div>

            <div>
              <FormLabel htmlFor="login-password">Password</FormLabel>
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
                w-full flex items-center justify-center gap-2 group
                rounded-lg bg-ink px-4 py-3.5
                font-jakarta text-sm font-semibold text-white
                transition-all duration-300 ease-in-out will-change-transform
                hover:bg-black hover:scale-[1.02] hover:-translate-y-px hover:shadow-md
                active:translate-y-0 active:scale-100 active:shadow-sm
                disabled:opacity-50 disabled:pointer-events-none
              "
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Toggle Link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleToggleState}
            className="text-xs text-charcoal/85 hover:text-ink font-semibold font-jakarta transition-colors"
          >
            {isRegistering
              ? 'Already have an account? Sign in'
              : 'New here? Create an account'}
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-paper-border/50 my-6" />

        {/* Seed Demo Button */}
        <button
          type="button"
          onClick={handleRunDemo}
          disabled={submitting}
          className="
            w-full flex items-center justify-center gap-2
            rounded-lg border border-horizon/30 bg-horizon/5 px-4 py-3
            font-jakarta text-sm font-semibold text-horizon
            transition-all duration-300
            hover:bg-horizon/10 hover:-translate-y-px hover:shadow-sm
            active:translate-y-0
            disabled:opacity-50 disabled:pointer-events-none
          "
        >
          <Sparkles size={16} />
          Run Demo with Seeded Data
        </button>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-charcoal/80 font-jakarta">
          Your data is encrypted and stored locally.
        </p>
      </div>
    </div>
  )
}
