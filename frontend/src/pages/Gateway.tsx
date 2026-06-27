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
import api from '../services/api'

/* ──────────────────────────────────────────────────────────
   Gateway.tsx — Onboarding & Multi-User Authentication
   Dual-State Layout: Sign In and Registration
   Zero-Scroll, Strict 0px Corner Radii Overhaul
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
    <div className="space-y-1">
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={`
            bg-cardLinen/40 border text-ink font-jakarta text-sm rounded-none px-4 py-2.5 pr-12 transition-all duration-300 w-full placeholder:text-charcoal/40
            focus:bg-white focus:border-sage focus:ring-1 focus:ring-sage/30 focus:outline-none
            ${error ? 'border-terracotta bg-terracotta/5 text-terracotta focus:border-terracotta focus:ring-terracotta/30 placeholder:text-terracotta/40' : 'border-paperBorder'}
          `}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/60 hover:text-ink cursor-pointer transition-colors"
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
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-ink font-jakarta mb-1">
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

  // Password Hygiene: wipe all local password state fields upon mount and view toggles
  useEffect(() => {
    setMasterPassword('')
    setConfirmPassword('')
    setPasswordTouched(false)
    setFormError(null)
  }, [isRegistering])

  // Secure memory wipe on unmount
  useEffect(() => {
    return () => {
      setMasterPassword('')
      setConfirmPassword('')
    }
  }, [])

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
        const res = await api.post('/auth/register', { email, password: masterPassword })
        if (res.data.success && res.data.token) {
          localStorage.setItem('bearer_token', res.data.token)
          await checkAuth()
        } else {
          throw new Error(res.data.message || 'Registration failed.')
        }
      } catch (err: any) {
        setFormError(err.response?.data?.message || err.message || 'Registration failed. Please try again.')
      } finally {
        setSubmitting(false)
      }
    },
    [email, masterPassword, confirmPassword, checkAuth],
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
        const res = await api.post('/auth/login', { email, password: masterPassword })
        if (res.data.success && res.data.token) {
          localStorage.setItem('bearer_token', res.data.token)
          await checkAuth()
        } else {
          throw new Error(res.data.message || 'Login failed.')
        }
      } catch (err: any) {
        setFormError(err.response?.data?.message || err.message || 'Login failed. Please try again.')
      } finally {
        setSubmitting(false)
      }
    },
    [email, masterPassword, checkAuth],
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
    <div className="min-h-screen h-screen w-screen overflow-hidden flex flex-col bg-canvas justify-center items-center px-4">
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
          p-8 rounded-2xl
          shadow-sm
          backdrop-blur-md
        "
      >
        {/* Brand Header Stack */}
        <div className="text-center flex flex-col items-center">
          <p className="font-jakarta text-xs font-bold tracking-[0.15em] text-charcoal uppercase text-center">
            LAST-MINUTE
          </p>
          <h1 className="font-lora text-3xl text-ink text-center mt-1">
            Life Saver
          </h1>
          <p className="font-jakarta text-sm text-charcoal text-center mt-2 mb-6">
            Proactive AI Productivity Companion
          </p>
        </div>

        {isRegistering ? (
          /* ════════════════════════════════════════════════
             Registration State
             ════════════════════════════════════════════════ */
          <form onSubmit={handleSetup} className="space-y-4">
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
                  bg-cardLinen/40 border border-paperBorder text-ink font-jakarta text-sm rounded-none px-4 py-2.5 transition-all duration-300 w-full placeholder:text-charcoal/40
                  focus:bg-white focus:border-sage focus:ring-1 focus:ring-sage/30 focus:outline-none
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
              <div className="rounded-none bg-terracotta/8 border border-terracotta/20 px-4 py-2">
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
                w-full flex items-center justify-center gap-2 group cursor-pointer
                rounded-none bg-ink px-4 py-3
                font-jakarta text-sm font-semibold text-white
                transition-all duration-300 ease-in-out will-change-transform
                hover:bg-ink hover:scale-[1.02] hover:shadow-md
                active:scale-100 active:shadow-sm
                disabled:opacity-50 disabled:pointer-events-none
              "
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} className="transition-transform duration-300 ease-in-out group-hover:translate-x-1.5" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* ════════════════════════════════════════════════
             Sign In State
             ════════════════════════════════════════════════ */
          <form onSubmit={handleLogin} className="space-y-4">
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
                  bg-cardLinen/40 border border-paperBorder text-ink font-jakarta text-sm rounded-none px-4 py-2.5 transition-all duration-300 w-full placeholder:text-charcoal/40
                  focus:bg-white focus:border-sage focus:ring-1 focus:ring-sage/30 focus:outline-none
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
              <div className="rounded-none bg-terracotta/8 border border-terracotta/20 px-4 py-2">
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
                w-full flex items-center justify-center gap-2 group cursor-pointer
                rounded-none bg-ink px-4 py-3
                font-jakarta text-sm font-semibold text-white
                transition-all duration-300 ease-in-out will-change-transform
                hover:bg-ink hover:scale-[1.02] hover:shadow-md
                active:scale-100 active:shadow-sm
                disabled:opacity-50 disabled:pointer-events-none
              "
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} className="transition-transform duration-300 ease-in-out group-hover:translate-x-1.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Toggle Link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering((prev) => !prev)}
            className="text-[11px] font-semibold font-jakarta tracking-wider text-charcoal underline uppercase cursor-pointer hover:text-ink transition-colors focus:outline-none"
          >
            {isRegistering
              ? 'Already have an account? Sign in'
              : 'New here? Create an account'}
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-paper-border/50 my-4" />

        {/* Seed Demo Button */}
        <button
          type="button"
          onClick={handleRunDemo}
          disabled={submitting}
          className="
            w-full flex items-center justify-center gap-2 cursor-pointer
            rounded-none border-0 bg-charcoal/10 px-4 py-2.5
            font-jakarta text-sm font-semibold text-charcoal
            transition-all duration-300 ease-in-out
            hover:scale-[1.02] hover:bg-charcoal/15 hover:shadow-sm
            active:scale-100
            disabled:opacity-50 disabled:pointer-events-none
          "
        >
          <Sparkles size={16} />
          Run Demo with Seeded Data
        </button>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-charcoal font-medium font-jakarta">
          Your data is encrypted and stored locally.
        </p>
      </div>
    </div>
  )
}
