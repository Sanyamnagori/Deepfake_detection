import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth functions
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const getCurrentUser = () => api.get('/auth/me');
export const updateProfile = (userData) => api.put('/auth/profile', userData);
export const changePassword = (passwordData) => api.put('/auth/change-password', passwordData);

// File operations
export const uploadFile = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
};

export const detectDeepfake = (uploadId) => {
  return api.post('/detect', { uploadId });
};

export const downloadReport = (resultId) => {
  return api.get(`/report/${resultId}`, { responseType: 'blob' });
};

// Result details
export const getResultDetails = (resultId) => {
  return api.get(`/result/${resultId}`);
};

export const getResultsHistory = () => {
  return api.get('/result');
};

export const compareModels = (uploadId) => {
  return api.post('/detect/compare', { uploadId });
};

export default api;
