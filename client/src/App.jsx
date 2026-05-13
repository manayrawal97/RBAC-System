import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
// import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"                    element={<LoginPage />} />
          <Route path="/register"                 element={<RegisterPage />} />
          <Route path="/forgot-password"          element={<ForgotPasswordPage />} />
          {/* <Route path="/reset-password/:token"    element={<ResetPasswordPage />} /> */}

          {/* Protected */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />

          {/* Default */}
          <Route path="/"   element={<Navigate to="/dashboard" replace />} />
          <Route path="*"   element={<Navigate to="/login"     replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App