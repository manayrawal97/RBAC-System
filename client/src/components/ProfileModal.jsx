import { useState } from 'react'
import api from '../services/api'
import { getErrorMessage } from '../utils/helpers'

/**
 * ProfileModal — lets any logged-in user edit their own profile
 * Calls PUT /api/users/me
 * No role field shown — users cannot change their own role
 */
const ProfileModal = ({ currentUser, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    username: currentUser.username || '',
    email:    currentUser.email    || '',
    password: '',
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Only send fields that have a value
      const payload = {}
      if (form.username && form.username !== currentUser.username)
        payload.username = form.username
      if (form.email && form.email !== currentUser.email)
        payload.email = form.email
      if (form.password)
        payload.password = form.password

      if (Object.keys(payload).length === 0) {
        setError('No changes detected.')
        setLoading(false)
        return
      }

      const res = await api.put('/users/me', payload)

      // Update localStorage so navbar shows new username immediately
      const stored = JSON.parse(localStorage.getItem('user') || '{}')
      const updated = { ...stored, ...res.data.data.user }
      localStorage.setItem('user', JSON.stringify(updated))

      onSuccess(res.data.data.user)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2>Edit My Profile</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p style={{
          fontSize: '.85rem',
          color: 'var(--text-secondary)',
          marginBottom: '1.25rem',
          marginTop: '-.5rem'
        }}>
          You can update your username, email, or password.
          Your role cannot be changed here.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              minLength={3}
              placeholder="Your username"
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Leave blank to keep current password"
              minLength={6}
            />
            <small className="form-hint">
              Only fill this in if you want to change your password.
            </small>
          </div>

          {/* Role is shown but read-only — transparency without editability */}
          <div className="form-group">
            <label>Role</label>
            <input
              type="text"
              value={currentUser.userType}
              disabled
              style={{ opacity: .6, cursor: 'not-allowed' }}
            />
            <small className="form-hint">Role cannot be changed from here.</small>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default ProfileModal