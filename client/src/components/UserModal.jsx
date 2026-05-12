import { useState, useEffect } from 'react'
import userService from '../services/userService'
import { getErrorMessage } from '../utils/helpers'

const UserModal = ({ editingUser, currentUserRole, onClose, onSuccess }) => {
  const isEditing = !!editingUser
  const [form, setForm]   = useState({ username: '', email: '', password: '', userType: 'USER' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editingUser) {
      setForm({
        username: editingUser.username || '',
        email:    editingUser.email    || '',
        password: '',
        userType: editingUser.userType || 'USER',
      })
    }
  }, [editingUser])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const payload = { ...form }
      if (isEditing && !payload.password) delete payload.password

      if (isEditing) await userService.updateUser(editingUser.id, payload)
      else           await userService.createUser(payload)

      onSuccess()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = currentUserRole === 'ADMIN'
    ? ['ADMIN', 'CLIENT', 'USER']
    : ['USER']

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit User' : 'Create New User'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" value={form.username}
              onChange={handleChange} required minLength={3} placeholder="johndoe" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={form.email}
              onChange={handleChange} required placeholder="user@example.com" />
          </div>
          <div className="form-group">
            <label>{isEditing ? 'New Password (blank = keep current)' : 'Password'}</label>
            <input type="password" name="password" value={form.password}
              onChange={handleChange} required={!isEditing} minLength={6}
              placeholder={isEditing ? 'Leave blank to keep current' : 'Minimum 6 characters'} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select name="userType" value={form.userType} onChange={handleChange}
              disabled={currentUserRole === 'CLIENT'}>
              {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {currentUserRole === 'CLIENT' &&
              <small className="form-hint">Clients can only create USER accounts.</small>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserModal