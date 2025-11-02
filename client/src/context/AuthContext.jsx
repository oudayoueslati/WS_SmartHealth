import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = 'http://localhost:5000/api/auth';

const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');

const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

const authAPI = {
  signup: async (username, email, password, firstName, lastName) => {
    const response = await axios.post(`${API_URL}/signup`, { 
      username, 
      email, 
      password,
      firstName,
      lastName
    });
    if (response.data.token) {
      setToken(response.data.token);
      setAuthHeader(response.data.token);
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { 
      email, 
      password 
    });
    if (response.data.token) {
      setToken(response.data.token);
      setAuthHeader(response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    try {
      await axios.post(`${API_URL}/logout`);
    } finally {
      removeToken();
      setAuthHeader(null);
    }
  },

  verifyToken: async () => {
    const token = getToken();
    if (!token) return null;
    
    try {
      const response = await axios.get(`${API_URL}/verify`);
      return response.data;
    } catch (error) {
      removeToken();
      setAuthHeader(null);
      return null;
    }
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        setAuthHeader(token);
        try {
          const result = await authAPI.verifyToken();
          if (result && result.success) {
            setUser(result.user);
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const result = await authAPI.login(email, password);
    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  const signup = async (username, email, password, firstName, lastName) => {
    const result = await authAPI.signup(username, email, password, firstName, lastName);
    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};