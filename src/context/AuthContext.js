// client/src/context/AuthContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import api from '../utils/api';

// Create Auth Context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // Load user from token
  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      // Check for token in localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Check if token is expired
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          localStorage.removeItem('token');
          setUser(null);
          setLoading(false);
          return;
        }
      } catch (jwtError) {
        // Invalid token
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Fetch user data
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch (err) {
      localStorage.removeItem('token');
      setUser(null);
      console.warn('Failed to authenticate:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/register', userData);
      
      // Set token in localStorage
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      
      setUser(user);
      toast.success('Registration successful!');
      navigate('/');
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      
      // Set token in localStorage
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      
      setUser(user);
      toast.success('Login successful!');
      navigate('/');
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await api.get('/auth/logout').catch(() => {
        // Silently fail if logout endpoint is unreachable
        console.warn('Logout endpoint unreachable');
      });
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      // Remove token from localStorage
      localStorage.removeItem('token');
      
      setUser(null);
      toast.info('You have been logged out');
      navigate('/');
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const res = await api.put('/auth/updatedetails', userData);
      setUser(res.data.data);
      toast.success('Profile updated successfully');
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      await api.put('/auth/updatepassword', passwordData);
      toast.success('Password updated successfully');
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Clear errors
  const clearErrors = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        loadUser,
        updateProfile,
        changePassword,
        clearErrors,
        isAuthenticated: !!user,
        isAdmin: user && user.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};