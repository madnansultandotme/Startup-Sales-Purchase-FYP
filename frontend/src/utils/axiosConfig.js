import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from './api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// List of endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/signup',
  '/auth/login',
  '/auth/refresh',
  '/auth/forget-password',
  '/auth/send-verification-code',
  '/auth/verify',
  '/api/marketplace',
  '/api/collaborations',
  '/api/stats',
  '/api/search',
  '/'
];

// Helper function to check if endpoint is public
const isPublicEndpoint = (url) => {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint)) || url === '/' || url === '';
};

// Request interceptor to add JWT token to headers
apiClient.interceptors.request.use(
  (config) => {
    const isPublic = isPublicEndpoint(config.url);
    
    console.log('🔍 Checking request:', {
      url: config.url,
      method: config.method?.toUpperCase(),
      isPublic: isPublic
    });
    
    // Extra logging for startup creation requests
    if (config.url === '/api/startups') {
      console.log('🚀 STARTUP CREATION REQUEST DETECTED');
      console.log('Request details:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        isPublic: isPublic,
        hasData: !!config.data
      });
    }
    
    // Only add auth headers for non-public endpoints
    if (!isPublic) {
      // Get token from localStorage first (primary), then cookies (fallback)
      const token = localStorage.getItem('access_token') || Cookies.get('token');
      const refreshToken = localStorage.getItem('refresh_token') || Cookies.get('refresh_token');
      
      console.log('🎫 Access token (localStorage/cookie):', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
      console.log('🔄 Refresh token (localStorage/cookie):', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'NOT FOUND');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Added Authorization header to protected request');
        
        // Special logging for startup creation
        if (config.url === '/api/startups') {
          console.log('🔑 STARTUP CREATION - Token found and added:', token.substring(0, 30) + '...');
        }
      } else {
        console.log('❌ No access token found for protected endpoint');
        
        // Special warning for startup creation
        if (config.url === '/api/startups') {
          console.error('⚠️ CRITICAL: STARTUP CREATION attempted without token!');
          console.error('This will result in a 403 Authentication credentials were not provided error');
        }
      }
    } else {
      console.log('🌍 Public endpoint - skipping authentication');
      // Log request body for public endpoints (helpful for debugging)
      if (config.url === '/signup' && config.data) {
        console.log('📝 Signup request body:', config.data);
      }
    }
    
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      isPublic: isPublic,
      hasAuthHeader: !!config.headers.Authorization,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? 'Bearer [TOKEN]' : 'No auth header'
      }
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Track if we're currently refreshing to prevent multiple refresh attempts
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

// Response interceptor to handle authentication errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase()
    });
    return response;
  },
  async (error) => {
    const errorDetails = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.response?.data?.error || error.message,
      detail: error.response?.data?.detail,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      hasAuthHeader: !!error.config?.headers?.Authorization
    };
    
    console.error('🚨 API Response Error:', errorDetails);
    
    const originalRequest = error.config;

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔒 401 Unauthorized - attempting token refresh...');
      
      if (isRefreshing) {
        // If refresh is in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token') || Cookies.get('refresh_token');
      
      if (refreshToken) {
        try {
          console.log('🔄 Attempting to refresh access token...');
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          }, {
            withCredentials: true
          });
          
          const newAccessToken = refreshResponse.data.access_token;
          
          if (newAccessToken) {
            console.log('✅ Access token refreshed successfully');
            // Store the new access token in localStorage (backend sets HttpOnly cookie)
            localStorage.setItem('access_token', newAccessToken);
            
            // Update the authorization header for this request
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            
            processQueue(null, newAccessToken);
            isRefreshing = false;
            
            // Retry the original request
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // Clear all tokens and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          Cookies.remove('token');
          Cookies.remove('refresh_token');
          
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
            console.log('Redirecting to login due to refresh failure...');
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        }
      } else {
        console.log('No refresh token available');
        isRefreshing = false;
        
        // Clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        Cookies.remove('token');
        Cookies.remove('refresh_token');
        
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
          console.log('Redirecting to login...');
          window.location.href = '/login';
        }
      }
    }
    
    // Handle 403 Forbidden - likely authentication/permission issue
    if (error.response?.status === 403) {
      console.log('🚫 403 Forbidden - Check if token is valid and user has permission');
      const token = localStorage.getItem('access_token') || Cookies.get('token');
      console.log('Current token (localStorage/cookie):', token ? `${token.substring(0, 20)}...` : 'No token found');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;