import api from './api'

const userService = {
    getUsers: () => api.get('/users'),
    getUserById: (id) => api.get(`/users/${id}`),
    createUser: (data) => api.post('/users', data),
    updateUser: (id, data) => api.put(`/users/${id}`, data),
    deleteUser: (id) => api.delete(`/users/${id}`),
}

export default userService