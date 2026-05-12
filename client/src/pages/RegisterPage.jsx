import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const RegisterPage = () => {
  const [form, setForm]   = useState({ username: '', email: '', password: '', userType: 'USER' })
  const [error, setError] = useState('')
  const { registerUser, loading } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await registerUser(form)
    if (result.success) navigate('/dashboard')
    else setError(result.message)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">👤</div>
          <h1>Create Account</h1>
          <p>Get started today</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" value={form.username}
              onChange={handleChange} placeholder="johndoe" required minLength={3} />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com" required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="Minimum 6 characters" required minLength={6} />
          </div>

          <div className="form-group">
            <label>Account Type</label>
            <select name="userType" value={form.userType} onChange={handleChange}>
              <option value="USER">User</option>
              <option value="CLIENT">Client</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage