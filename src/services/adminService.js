import axios from 'axios';

// Use the correct backend URL - assuming the backend runs on port 5000
const BASE_URL = 'http://localhost:5000/api';

// Get dashboard stats
export const getDashboardStats = async () => {
  try {
    // Get token for authentication
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get(`${BASE_URL}/admin/stats`, { 
      headers,
      withCredentials: true
    });
    
    if (response.data && response.data.data) {
      return response.data.data;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    throw error.response?.data?.error || 'Failed to fetch dashboard stats';
  }
};

// User Management
export const getUsers = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers,
      withCredentials: true
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error.response?.data?.error || 'Failed to fetch users';
  }
};

export const getUser = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get(`${BASE_URL}/admin/users/${id}`, {
      headers,
      withCredentials: true
    });
    
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch user ${id}:`, error);
    throw error.response?.data?.error || 'Failed to fetch user';
  }
};

export const createUser = async (userData) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.post(`${BASE_URL}/admin/users`, userData, {
      headers,
      withCredentials: true
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error.response?.data?.error || 'Failed to create user';
  }
};

export const updateUser = async (id, userData) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.put(`${BASE_URL}/admin/users/${id}`, userData, {
      headers,
      withCredentials: true
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error.response?.data?.error || 'Failed to update user';
  }
};

export const deleteUser = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.delete(`${BASE_URL}/admin/users/${id}`, {
      headers,
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error.response?.data?.error || 'Failed to delete user';
  }
};

// Recipe Moderation
export const moderateRecipe = async (id, status, moderationNote = '') => {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.put(`${BASE_URL}/admin/recipes/${id}/moderate`, {
      status,
      moderationNote
    }, {
      headers,
      withCredentials: true
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to moderate recipe:', error);
    throw error.response?.data?.error || 'Failed to moderate recipe';
  }
};