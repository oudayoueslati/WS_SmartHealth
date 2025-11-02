import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Set token in localStorage
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Set auth header
export const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Initialize auth header on app load
const token = getToken();
if (token) {
  setAuthHeader(token);
}

// Auth API functions
export const authAPI = {
  signup: async (username, email, password) => {
    const response = await axios.post('/signup', { username, email, password });
    if (response.data.token) {
      setToken(response.data.token);
      setAuthHeader(response.data.token);
    }
    return response.data;
  },

  login: async (username, password) => {
    const response = await axios.post('/login', { username, password });
    if (response.data.token) {
      setToken(response.data.token);
      setAuthHeader(response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    try {
      await axios.post('/logout');
    } finally {
      removeToken();
      setAuthHeader(null);
    }
  },

  verifyToken: async () => {
    const token = getToken();
    if (!token) return null;
    
    try {
      const response = await axios.get('/verify');
      return response.data;
    } catch (error) {
      removeToken();
      setAuthHeader(null);
      return null;
    }
  }
};

export default authAPI;