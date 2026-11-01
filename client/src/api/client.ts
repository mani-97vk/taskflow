import axios from 'axios';

const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    // If running on Vite dev server (port 5173), point to backend port 5000
    if (window.location.port === '5173') {
      return 'http://localhost:5000/api';
    }
    // In production or when served together, use current origin
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:5000/api';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Send cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header if token exists in localStorage as backup
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/auth')) {
      // Don't redirect if already on auth pages
      localStorage.removeItem('taskflow_token');
    }
    return Promise.reject(error);
  }
);
