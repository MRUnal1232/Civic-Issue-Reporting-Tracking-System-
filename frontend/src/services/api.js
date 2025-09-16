import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instances for different purposes
export const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const issuesAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const adminAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const usersAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
const addAuthToken = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Add request interceptors
[authAPI, issuesAPI, adminAPI, usersAPI].forEach(api => {
  api.interceptors.request.use(addAuthToken);
});

// Response interceptor for handling errors
const handleResponseError = (error) => {
  if (error.response?.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

// Add response interceptors
[authAPI, issuesAPI, adminAPI, usersAPI].forEach(api => {
  api.interceptors.response.use(
    (response) => response,
    handleResponseError
  );
});

// Auth API endpoints
export const authEndpoints = {
  login: (credentials) => authAPI.post('/auth/login', credentials),
  register: (userData) => authAPI.post('/auth/register', userData),
  getProfile: () => authAPI.get('/auth/profile'),
  updateProfile: (profileData) => authAPI.put('/auth/profile', profileData),
  changePassword: (passwordData) => authAPI.post('/auth/change-password', passwordData),
  refreshToken: () => authAPI.post('/auth/refresh'),
};

// Issues API endpoints
export const issuesEndpoints = {
  getIssues: (params) => issuesAPI.get('/issues', { params }),
  getIssue: (id) => issuesAPI.get(`/issues/${id}`),
  createIssue: (issueData) => issuesAPI.post('/issues', issueData),
  updateIssue: (id, issueData) => issuesAPI.put(`/issues/${id}`, issueData),
  deleteIssue: (id) => issuesAPI.delete(`/issues/${id}`),
  upvoteIssue: (id) => issuesAPI.post(`/issues/${id}/upvote`),
  removeUpvote: (id) => issuesAPI.delete(`/issues/${id}/upvote`),
  addComment: (id, comment) => issuesAPI.post(`/issues/${id}/comments`, comment),
  getUserIssues: (userId, params) => issuesAPI.get(`/issues/user/${userId}`, { params }),
  classifyIssue: (formData) => issuesAPI.post('/issues/classify', formData),
  suggestCategory: (description) => issuesAPI.post('/issues/suggest-category', { description }),
};

// Admin API endpoints
export const adminEndpoints = {
  getDashboard: () => adminAPI.get('/admin/dashboard'),
  getIssues: (params) => adminAPI.get('/admin/issues', { params }),
  updateIssueStatus: (id, statusData) => adminAPI.put(`/admin/issues/${id}/status`, statusData),
  assignIssue: (id, assignmentData) => adminAPI.put(`/admin/issues/${id}/assign`, assignmentData),
  updateIssuePriority: (id, priorityData) => adminAPI.put(`/admin/issues/${id}/priority`, priorityData),
  getUsers: (params) => adminAPI.get('/admin/users', { params }),
  updateUserStatus: (id, statusData) => adminAPI.put(`/admin/users/${id}/status`, statusData),
  getAnalytics: (params) => adminAPI.get('/admin/analytics', { params }),
};

// Users API endpoints
export const usersEndpoints = {
  getProfile: () => usersAPI.get('/users/profile'),
  updateProfile: (profileData) => usersAPI.put('/users/profile', profileData),
  getMyIssues: (params) => usersAPI.get('/users/my-issues', { params }),
  getStats: () => usersAPI.get('/users/stats'),
  changePassword: (passwordData) => usersAPI.post('/users/change-password', passwordData),
  uploadAvatar: (formData) => usersAPI.post('/users/upload-avatar', formData),
  deleteAccount: (password) => usersAPI.delete('/users/account', { data: { password } }),
};

// Utility function for file uploads
export const uploadFile = async (file, endpoint, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  };

  return issuesAPI.post(endpoint, formData, config);
};

// Utility function for handling API errors
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.message || 'An error occurred',
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
    };
  }
};

export default {
  authAPI,
  issuesAPI,
  adminAPI,
  usersAPI,
  authEndpoints,
  issuesEndpoints,
  adminEndpoints,
  usersEndpoints,
  uploadFile,
  handleAPIError,
};
