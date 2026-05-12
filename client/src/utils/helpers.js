/**
 * Role badge config — color per role
 */
export const ROLE_CONFIG = {
  ADMIN:  { label: 'Admin',  color: '#dc2626' },
  CLIENT: { label: 'Client', color: '#2563eb' },
  USER:   { label: 'User',   color: '#16a34a' },
}

/**
 * Format a date string to readable format
 */
export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

/**
 * Get error message from axios error response
 */
export const getErrorMessage = (error, fallback = 'Something went wrong.') => {
  return error?.response?.data?.message || fallback
}