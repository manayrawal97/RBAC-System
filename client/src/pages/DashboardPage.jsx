import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import userService from '../services/userService'
import UserModal from '../components/UserModal'
import { ROLE_CONFIG, formatDate } from '../utils/helpers'
import ProfileModal from '../components/ProfileModal'

const DashboardPage = () => {
  const { user, logoutUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  const canManage = user?.userType === 'ADMIN' || user?.userType === 'CLIENT'

  const fetchUsers = useCallback(async () => {
    if (!canManage) { setLoading(false); return }
    setLoading(true); setError('')
    try {
      const res = await userService.getUsers()
      setUsers(res.data.data.users)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [canManage])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleModalSuccess = () => { setModalOpen(false); fetchUsers() }
  const openCreate = () => { setEditingUser(null); setModalOpen(true) }
  const openEdit = (u) => { setEditingUser(u); setModalOpen(true) }

  // ---------------------New------------------
  const handleProfileSuccess = (updatedUser) => {
    // Update the user shown in the navbar immediately without a page reload
    // Force a re-read from localStorage by triggering re-render
    setProfileModalOpen(false)
    window.location.reload()  // simplest way to refresh auth context from localStorage
  }

  const handleDelete = async (id) => {
    try {
      await userService.deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.')
    }
  }

  const roleCfg = ROLE_CONFIG[user?.userType] || {}

  return (
    <div className="dashboard">

      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="navbar-logo">🔐</span>
          <span>RBAC System</span>
        </div>
        <div className="navbar-user">
          <span className="user-name">{user?.username}</span>
          <span className="role-badge" style={{ background: roleCfg.color }}>
            {roleCfg.label}
          </span>

          {/* Edit Profile — visible to ALL roles */}
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setProfileModalOpen(true)}
          >
            Edit Profile
          </button>

          <button className="btn btn-outline btn-sm" onClick={logoutUser}>
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard-main">

        {/* ── Welcome card ── */}
        <div className="welcome-card">
          <div>
            <h2>Welcome back, {user?.username}! 👋</h2>
            <p>
              Signed in as <strong>{user?.userType}</strong> ·{' '}
              {user?.userType === 'ADMIN' && 'Full access to all users.'}
              {user?.userType === 'CLIENT' && 'Manage users you have created.'}
              {user?.userType === 'USER' && 'Basic access only.'}
            </p>
          </div>
          <div className="welcome-meta">
            <div className="meta-item">
              <span className="meta-label">Email</span>
              <span className="meta-value">{user?.email}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Role</span>
              <span className="role-badge" style={{ background: roleCfg.color }}>
                {roleCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* ── Permissions grid ── */}
        <div className="permissions-card">
          <h3>Your Permissions</h3>
          <div className="permissions-grid">
            <PermItem label="View Users" allowed={canManage} />
            <PermItem label="Create Users" allowed={canManage} />
            <PermItem label="Edit Users" allowed={canManage} />
            <PermItem label="Delete Users" allowed={canManage} />
            <PermItem label="Manage All Users" allowed={user?.userType === 'ADMIN'} />
            <PermItem label="Create Clients" allowed={user?.userType === 'ADMIN'} />
          </div>
        </div>

        {/* ── User table (ADMIN + CLIENT only) ── */}
        {canManage && (
          <div className="users-section">
            <div className="section-header">
              <h3>
                {user?.userType === 'ADMIN' ? 'All Users' : 'Your Users'}
                <span className="count-badge">{users.length}</span>
              </h3>
              <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
              <div className="loading-state">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <p>No users yet.</p>
                <button className="btn btn-primary" onClick={openCreate}>
                  Create your first user
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const cfg = ROLE_CONFIG[u.userType] || {}
                      return (
                        <tr key={u.id}>
                          <td className="td-username">{u.username}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className="role-badge" style={{ background: cfg.color }}>
                              {cfg.label}
                            </span>
                          </td>
                          <td>{formatDate(u.createdAt)}</td>
                          <td className="td-actions">
                            <button className="btn btn-sm btn-outline" onClick={() => openEdit(u)}>
                              Edit
                            </button>
                            {deleteConfirm === u.id ? (
                              <>
                                <button className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(u.id)}>Confirm</button>
                                <button className="btn btn-sm btn-outline"
                                  onClick={() => setDeleteConfirm(null)}>Cancel</button>
                              </>
                            ) : (
                              <button className="btn btn-sm btn-danger"
                                onClick={() => setDeleteConfirm(u.id)}>Delete</button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Basic access message for USER role ── */}
        {user?.userType === 'USER' && (
          <div className="basic-access-card">
            <h3>Basic Access</h3>
            <p>You have basic access. Contact an Admin or Client to manage users.</p>
          </div>
        )}

      </main>

      {modalOpen && (
        <UserModal
          editingUser={editingUser}
          currentUserRole={user?.userType}
          onClose={() => setModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}

{/* ----------------new added------------ */}
      {profileModalOpen && (
        <ProfileModal
          currentUser={user}
          onClose={() => setProfileModalOpen(false)}
          onSuccess={handleProfileSuccess}
        />
      )}
    </div>
  )
}

const PermItem = ({ label, allowed }) => (
  <div className={`perm-item ${allowed ? 'allowed' : 'denied'}`}>
    <span>{allowed ? '✅' : '❌'}</span>
    <span>{label}</span>
  </div>
)

export default DashboardPage