import { useState } from 'react'
import { Link } from 'react-router-dom'
import authService from '../services/authService'
import { getErrorMessage } from '../utils/helpers'

const ForgotPasswordPage = () => {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setMessage('')
    try {
      const res = await authService.forgotPassword(email)
      setMessage(res.data.message)
    } catch (err) {
      setError(getErrorMessage(err))
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
          <p>Enter your email to get a reset link</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error   && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="auth-switch"><Link to="/login">← Back to Login</Link></p>
      </div>
    </div>
  )
}

export default ForgotPasswordPage