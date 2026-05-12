import api from './api'

const authService = {
  register:       (data)            => api.post('/auth/register', data),
  login:          (data)            => api.post('/auth/login', data),
  logout:         ()                => api.post('/auth/logout'),
  getMe:          ()                => api.get('/auth/me'),
  forgotPassword: (email)           => api.post('/auth/forgot-password', { email }),
  resetPassword:  (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
}

export default authService