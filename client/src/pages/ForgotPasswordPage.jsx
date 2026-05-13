import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import authService from '../services/authService'
import { getErrorMessage } from '../utils/helpers'

// ─────────────────────────────────────────────────────────────────
// STATE 1 — Email input: user requests a reset link
// ─────────────────────────────────────────────────────────────────
const RequestResetForm = () => {
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await authService.forgotPassword(email)
      // Always show success — never reveal if email exists (security)
      setSubmitted(true)
    } catch (err) {
      // Even on a real server error, show the safe message
      // Only surface errors that are clearly not email-related
      const status = err?.response?.status
      if (status === 429) {
        setError('Too many requests. Please wait a moment and try again.')
      } else {
        setSubmitted(true)  // fallback: still show safe message
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <div className="auth-logo">🔑</div>
          <h1>Forgot Password</h1>
          <p>Enter your email and we'll send a reset link</p>
        </div>

        {/* Success state — shown after submit */}
        {submitted ? (
          <div className="reset-success-box">
            <div className="reset-success-icon">📬</div>
            <p className="reset-success-msg">
              If this email is registered, a reset link has been sent.
            </p>
            <p className="reset-success-sub">
              Check your inbox (and spam folder). The link expires in 1 hour.
            </p>
            <button
              className="btn btn-outline btn-full"
              style={{ marginTop: '1.25rem' }}
              onClick={() => { setSubmitted(false); setEmail('') }}
            >
              Try a different email
            </button>
          </div>
        ) : (
          /* Form state */
          <>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="reset-email">Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading || !email.trim()}
              >
                {loading
                  ? <><span className="btn-spinner" />Sending...</>
                  : 'Send Reset Link'
                }
              </button>
            </form>
          </>
        )}

        <p className="auth-switch">
          <Link to="/login">← Back to Login</Link>
        </p>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// STATE 2 — New password form: shown when ?token= exists in URL
// ─────────────────────────────────────────────────────────────────
const NewPasswordForm = ({ token }) => {
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess]   = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    // Clear field-level error as user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
    setError('')
  }

  // Frontend validation before hitting the API
  const validate = () => {
    const errs = {}
    if (form.newPassword.length < 6) {
      errs.newPassword = 'Password must be at least 6 characters.'
    }
    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.'
    } else if (form.newPassword !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.'
    }
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }

    setLoading(true)
    setError('')

    try {
      await authService.resetPassword(token, form.newPassword)
      setSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err, 'This reset link is invalid or has expired.'))
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──────────────────────────────────
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-logo">✅</div>
          <h1 style={{ marginBottom: '.5rem' }}>Password Updated!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
          <Link to="/login" className="btn btn-primary btn-full">
            Go to Login →
          </Link>
        </div>
      </div>
    )
  }

  // ── Password form ───────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <div className="auth-logo">🔒</div>
          <h1>Set New Password</h1>
          <p>Choose a strong password for your account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              required
              autoFocus
              autoComplete="new-password"
              className={fieldErrors.newPassword ? 'input-error' : ''}
            />
            {fieldErrors.newPassword && (
              <span className="field-error">{fieldErrors.newPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your new password"
              required
              autoComplete="new-password"
              className={fieldErrors.confirmPassword ? 'input-error' : ''}
            />
            {fieldErrors.confirmPassword && (
              <span className="field-error">{fieldErrors.confirmPassword}</span>
            )}
            {/* Live match indicator */}
            {form.confirmPassword && !fieldErrors.confirmPassword && (
              <span className="field-ok">
                {form.newPassword === form.confirmPassword ? '✓ Passwords match' : ''}
              </span>
            )}
          </div>

          {/* Strength hint */}
          <PasswordStrength password={form.newPassword} />

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading
              ? <><span className="btn-spinner" />Resetting...</>
              : 'Reset Password'
            }
          </button>
        </form>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Password strength indicator (bonus UX)
// ─────────────────────────────────────────────────────────────────
const PasswordStrength = ({ password }) => {
  if (!password) return null

  const getStrength = (p) => {
    let score = 0
    if (p.length >= 6)  score++
    if (p.length >= 10) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  }

  const score = getStrength(password)
  const levels = [
    { label: 'Very weak', color: '#ef4444' },
    { label: 'Weak',      color: '#f97316' },
    { label: 'Fair',      color: '#eab308' },
    { label: 'Good',      color: '#22c55e' },
    { label: 'Strong',    color: '#16a34a' },
  ]
  const level = levels[Math.min(score, 4)]

  return (
    <div className="strength-wrap">
      <div className="strength-bars">
        {levels.map((l, i) => (
          <div
            key={i}
            className="strength-bar"
            style={{ background: i < score ? level.color : 'var(--border)' }}
          />
        ))}
      </div>
      <span className="strength-label" style={{ color: level.color }}>
        {level.label}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main export — detects which state to show based on ?token= param
// ─────────────────────────────────────────────────────────────────
const ForgotPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')  // null if not in URL

  // If ?token= exists in URL → show new password form
  // Otherwise → show email request form
  return token ? <NewPasswordForm token={token} /> : <RequestResetForm />
}

export default ForgotPasswordPage


// import { useState } from 'react'
// import { Link } from 'react-router-dom'
// import authService from '../services/authService'
// import { getErrorMessage } from '../utils/helpers'

// const ForgotPasswordPage = () => {
//   const [email, setEmail]     = useState('')
//   const [loading, setLoading] = useState(false)
//   const [message, setMessage] = useState('')
//   const [error, setError]     = useState('')

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setLoading(true); setError(''); setMessage('')
//     try {
//       const res = await authService.forgotPassword(email)
//       setMessage(res.data.message)
//     } catch (err) {
//       setError(getErrorMessage(err))
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="auth-page">
//       <div className="auth-card">
//         <div className="auth-header">
//           <div className="auth-logo">🔑</div>
//           <h1>Forgot Password</h1>
//           <p>Enter your email to get a reset link</p>
//         </div>

//         {message && <div className="alert alert-success">{message}</div>}
//         {error   && <div className="alert alert-error">{error}</div>}

//         <form onSubmit={handleSubmit} className="auth-form">
//           <div className="form-group">
//             <label>Email Address</label>
//             <input type="email" value={email} onChange={e => setEmail(e.target.value)}
//               placeholder="you@example.com" required />
//           </div>
//           <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
//             {loading ? 'Sending...' : 'Send Reset Link'}
//           </button>
//         </form>

//         <p className="auth-switch"><Link to="/login">← Back to Login</Link></p>
//       </div>
//     </div>
//   )
// }

// export default ForgotPasswordPage