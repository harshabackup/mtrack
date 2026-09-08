// Setup axios instance
import axiosInstance from 'axios';

const api = axiosInstance.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// Add a request interceptor to append the token
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

// Endpoints that legitimately return 401 as part of normal flow (unknown
// account, wrong OTP/password, etc.) rather than an expired session -
// these should surface their error message, not force a redirect/reload.
const AUTH_FLOW_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/login-password',
  '/api/v1/auth/send-otp',
  '/api/v1/auth/verify-otp',
  '/api/v1/auth/accept-invite',
];

// Add a response interceptor to handle token expiry
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const requestUrl: string = error.config?.url || '';
    const isAuthFlowRequest = AUTH_FLOW_PATHS.some((path) => requestUrl.includes(path));

    if (error.response && error.response.status === 401 && !isAuthFlowRequest) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
