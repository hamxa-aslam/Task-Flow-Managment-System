 import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Aapke Laravel backend ka API URL
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const projectsApi = {
  list: () => api.get('/projects'),
  create: (payload) => api.post('/projects', payload),
  remove: (projectId) => api.delete(`/projects/${projectId}`),
};

export const usersApi = {
  remove: (userId) => api.delete(`/users/${userId}`),
};

export const invitationsApi = {
  pending: () => api.get('/invitations/pending'),
  accept: (invitationId) => api.post(`/invitations/${invitationId}/accept`),
  reject: (invitationId) => api.post(`/invitations/${invitationId}/reject`),
  invite: (projectId, email) => api.post(`/projects/${projectId}/invite`, { email }),
};

export default api;