import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  profile: () => API.get('/auth/profile'),
};

// ── Food ──────────────────────────────────────────────────────
export const foodAPI = {
  getAll: (params) => API.get('/food', { params }),
  getOne: (id) => API.get(`/food/${id}`),
  getMy: (params) => API.get('/food/my', { params }),
  create: (data) => API.post('/food', data),
  update: (id, data) => API.put(`/food/${id}`, data),
  delete: (id) => API.delete(`/food/${id}`),
};

// ── Requests ──────────────────────────────────────────────────
export const requestAPI = {
  create: (data) => API.post('/request', data),
  getDonorRequests: (params) => API.get('/request/donor', { params }),
  getNGORequests: (params) => API.get('/request/ngo', { params }),
  updateStatus: (id, data) => API.put(`/request/${id}/status`, data),
  complete: (id) => API.put(`/request/${id}/complete`),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => API.get('/admin/stats'),
  getUsers: (params) => API.get('/admin/users', { params }),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  toggleUser: (id) => API.patch(`/admin/users/${id}/toggle`),
  getFoods: (params) => API.get('/admin/foods', { params }),
  deleteFood: (id) => API.delete(`/admin/foods/${id}`),
};

export default API;
