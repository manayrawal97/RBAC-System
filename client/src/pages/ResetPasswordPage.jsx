import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import authService from '../services/authService'
import { getErrorMessage } from '../utils/helpers'

const ResetPasswordPage = () => {
  const { token }   = useParams()
  const navigate    = useNavigate()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true); setError('')
    try {
      await authService.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid or expired token.'))
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-logo">✅</div>
        <h2 style={{ margin: '1rem 0 .5rem' }}>Password Reset!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Redirecting to login in 3 seconds...
        </p>
        <Link to="/login" className="btn btn-primary btn-full">Go to Login</Link>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🔒</div>
          <h1>Reset Password</h1>
          <p>Choose a new password</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 6 characters" required minLength={6} />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat new password" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage