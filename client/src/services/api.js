import axios from 'axios'

const api = axios.create({
  baseURL: '/api',   // proxied to http://localhost:5000/api via vite.config.js
})

/**
 * Request interceptor
 * Attaches JWT token from localStorage to every outgoing request
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Response interceptor
 * If any response comes back 401 (expired/invalid token) → auto logout
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api