import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  // Not logged in → redirect to login, remember where they came from
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but wrong role → redirect to dashboard
  if (roles.length > 0 && !roles.includes(user?.userType)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute