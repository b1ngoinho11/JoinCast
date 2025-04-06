import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = 'http://localhost:8000'; // Change this to your backend URL

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors for debugging
    console.error('API Error:', error);
    
    // You can add global error handling here if needed
    if (error.response && error.response.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
      Cookies.remove('auth_token');
      Cookies.remove('refresh_token');
      // Optional: window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  register: (userData) => api.post('/api/v1/auth/register', userData),
  login: (credentials) => api.post('/api/v1/auth/login', credentials),
  getCurrentUser: () => api.get('/api/v1/auth/me'),
  changePassword: (passwordData) => api.post('/api/v1/auth/password-change', passwordData),
};

// Export the api instance for other services
export default api;
