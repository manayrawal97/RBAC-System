import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LoginPage = () => {
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [inactiveMsg, setInactiveMsg] = useState('')

  const { loginUser, loading, isAuthenticated } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })

    // Show message if auto-logged out due to inactivity
    if (sessionStorage.getItem('auto_logout')) {
      setInactiveMsg('You were logged out due to inactivity. Please sign in again.')
      sessionStorage.removeItem('auto_logout')
    }
  }, [isAuthenticated])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await loginUser(form.email, form.password)
    if (!result.success) setError(result.message)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🔐</div>
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>

        {inactiveMsg && <div className="alert alert-warning">{inactiveMsg}</div>}
        {error       && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com" required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="Enter your password" required />
          </div>

          <div className="form-footer-link">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage