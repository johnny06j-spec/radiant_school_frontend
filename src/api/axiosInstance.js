// src/api/axiosInstance.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
  withCredentials: true, // Keeps httpOnly cookies active on desktop browsers
});

// Request Interceptor: Attach Bearer token for iOS Safari / cross-origin mobile compatibility
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handles 401 Unauthorized errors by automatically refreshing tokens
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const refreshRes = await API.post('/auth/refresh', refreshToken ? { refreshToken } : {});

        // Save newly issued accessToken if returned in JSON body
        const newAccessToken = refreshRes.data?.accessToken || refreshRes.data?.token;
        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return API(originalRequest);
      } catch (refreshErr) {
        console.error("Session refresh failed. Redirecting to login...", refreshErr);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;