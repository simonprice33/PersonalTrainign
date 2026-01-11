import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: BACKEND_URL
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminAccessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    console.log('🔴 Axios interceptor caught error:', status, error.config?.url);

    // Skip refresh for refresh endpoint itself to prevent infinite loop
    if (originalRequest.url?.includes('/api/admin/refresh')) {
      return Promise.reject(error);
    }

    // Handle both 401 (Unauthorized) and 403 (Forbidden/expired token) errors
    // Backend returns 403 when token is invalid or expired
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      console.log('🔄 Token expired or invalid, attempting refresh...');
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('adminRefreshToken');

      if (!refreshToken) {
        // No refresh token, redirect to login
        console.log('❌ No refresh token found, redirecting to login');
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        window.location.href = '/admin';
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the token
        console.log('🔄 Calling refresh token endpoint...');
        const response = await axios.post(`${BACKEND_URL}/api/admin/refresh`, {
          refreshToken
        });

        if (response.data.success) {
          const { accessToken } = response.data;
          
          console.log('✅ Token refreshed successfully');
          
          // Update stored token
          localStorage.setItem('adminAccessToken', accessToken);
          
          // Update the authorization header
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          
          // Process queued requests
          processQueue(null, accessToken);
          
          // Retry the original request
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        console.log('❌ Token refresh failed:', refreshError.response?.status, refreshError.message);
        processQueue(refreshError, null);
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        window.location.href = '/admin';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
