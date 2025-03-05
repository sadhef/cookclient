import axios from 'axios';

// Get API URL from environment variables
const API_URL = process.env.REACT_APP_API_URL || 'https://cookify-backend.vercel.app/api';

// Create axios instance with baseURL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000, // 60 seconds for chatbot requests
  withCredentials: true // Include credentials for cross-origin requests
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Increase timeout for chatbot-related endpoints
    if (config.url && config.url.includes('/chatbot')) {
      config.timeout = 60000; // 60 seconds for chatbot requests
    }
    
    return config;
  },
  error => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  response => response,
  error => {
    // Don't show errors for language API calls
    const isSilentEndpoint = error.config?.url?.includes('/settings/language');
    
    // Handle timeout errors for chatbot
    if (error.code === 'ECONNABORTED' && error.message && error.message.includes('timeout')) {
      console.error('Request timeout:', error.config?.url);
      
      // For chatbot endpoints, return friendly message
      if (error.config?.url?.includes('/chatbot')) {
        return Promise.reject({
          response: {
            data: {
              error: 'The request took too long to process. Please try a shorter message or try again later.'
            }
          }
        });
      }
    }
    
    // Handle 404 errors
    if (error.response?.status === 404) {
      const url = error.config?.url || '';
      console.warn(`Resource not found: ${url}`);
      
      // For language endpoint, return empty success to avoid app breaking
      if (isSilentEndpoint) {
        return { data: { success: true, data: { language: 'en' } } };
      }
      
      // For recipes endpoints, return empty data
      if (url.includes('/recipes')) {
        console.warn('Returning empty recipe data');
        return { 
          data: { 
            success: true, 
            data: [], 
            count: 0 
          } 
        };
      }
    }
    
    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Only clear token if it exists to avoid infinite redirects
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('user');
        
        // Redirect based on path, but avoid redirect loops
        const path = window.location.pathname;
        if (path.includes('admin') && !path.includes('admin/login')) {
          window.location.href = '/admin/login';
        } else if (!path.includes('login')) {
          window.location.href = '/login';
        }
      }
    }
    
    // Only log non-silent endpoint errors
    if (!isSilentEndpoint) {
      console.error('API Error:', error.response?.data?.error || error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper function for safe API calls with fallback
export const safeApiCall = async (apiCall, fallbackData = null) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    console.warn('API call failed, using fallback data');
    return fallbackData;
  }
};

// Common API endpoints
export const apiEndpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    adminLogin: '/auth/admin/login',
    verify: '/auth/verify',
    logout: '/auth/logout',
    me: '/auth/me'
  },
  recipes: {
    getAll: '/recipes',
    get: (id) => `/recipes/${id}`,
    search: '/recipes/search',
    favorite: (id) => `/recipes/${id}/favorite`,
    unfavorite: (id) => `/recipes/${id}/unfavorite`
  },
  reviews: {
    getForRecipe: (recipeId) => `/recipes/${recipeId}/reviews`,
    get: (id) => `/reviews/${id}`,
    update: (id) => `/reviews/${id}`,
    delete: (id) => `/reviews/${id}`
  },
  users: {
    getAll: '/admin/users',
    get: (id) => `/admin/users/${id}`,
    create: '/admin/users',
    update: (id) => `/admin/users/${id}`,
    delete: (id) => `/admin/users/${id}`
  },
  admin: {
    stats: '/admin/stats',
    moderateRecipe: (id) => `/admin/recipes/${id}/moderate`
  },
  nutrition: {
    calculate: '/nutrition/calculate',
    ingredients: '/nutrition/ingredients'
  },
  chatbot: {
    message: '/chatbot/message',
    suggest: '/chatbot/suggest'
  }
};

export default api;