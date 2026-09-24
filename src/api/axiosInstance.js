// src/api/axiosInstance.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api', 
  timeout: 10000,
  withCredentials: true, // 🟢 CRITICAL: Enables automatic cross-origin httpOnly cookie transmission
});

// Response Interceptor: Handles 401 Unauthorized errors by automatically refreshing tokens
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop if the refresh endpoint itself fails or request was already retried
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      try {
        // Attempt to re-issue access token using httpOnly refresh cookie
        await API.post('/auth/refresh');
        
        // Retry the original request with new cookies attached
        return API(originalRequest);
      } catch (refreshErr) {
        console.error("Session refresh failed. Redirecting to login...", refreshErr);
        // Clear local session storage if used and redirect user to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;