import axios from 'axios';
import api from '../utils/api';

// Use the backend URL from the api.js configuration
// No hardcoded localhost URLs anywhere in the code

// Get dashboard stats
export const getDashboardStats = async () => {
  try {
    // Get token for authentication
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Use the api instance instead of direct axios calls
    const response = await api.get('/admin/stats');
    
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
    const response = await api.get('/admin/users');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error.response?.data?.error || 'Failed to fetch users';
  }
};

export const getUser = async (id) => {
  try {
    const response = await api.get(`/admin/users/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch user ${id}:`, error);
    throw error.response?.data?.error || 'Failed to fetch user';
  }
};

export const createUser = async (userData) => {
  try {
    const response = await api.post('/admin/users', userData);
    return response.data.data;
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error.response?.data?.error || 'Failed to create user';
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data.data;
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error.response?.data?.error || 'Failed to update user';
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error.response?.data?.error || 'Failed to delete user';
  }
};

// Recipe Moderation
export const moderateRecipe = async (id, status, moderationNote = '') => {
  try {
    const response = await api.put(`/admin/recipes/${id}/moderate`, {
      status,
      moderationNote
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to moderate recipe:', error);
    throw error.response?.data?.error || 'Failed to moderate recipe';
  }
};