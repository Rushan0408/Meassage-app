// Helper functions for authentication
import api from '../services/api';

// Save auth data in local storage
export const setAuthData = (token, userId, refreshToken = null) => {
  localStorage.setItem('token', token);
  localStorage.setItem('userId', userId);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  localStorage.setItem('tokenTimestamp', Date.now().toString());
};

// Get auth data from local storage
export const getAuthData = () => {
  return {
    token: localStorage.getItem('token'),
    userId: localStorage.getItem('userId'),
    refreshToken: localStorage.getItem('refreshToken'),
    tokenTimestamp: localStorage.getItem('tokenTimestamp')
  };
};

// Remove auth data from local storage
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenTimestamp');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Check if token is likely expired (default 1 hour lifetime)
export const isTokenExpired = (expiryTimeInMinutes = 60) => {
  const tokenTimestamp = localStorage.getItem('tokenTimestamp');
  if (!tokenTimestamp) return true;
  
  const timestamp = parseInt(tokenTimestamp, 10);
  const now = Date.now();
  const expiryTime = expiryTimeInMinutes * 60 * 1000; // Convert minutes to milliseconds
  
  return now - timestamp > expiryTime;
};

// Refresh access token
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    console.log('Attempting to refresh token, refresh token exists:', !!refreshToken);
    
    if (!refreshToken) {
      console.log('No refresh token available');
      return false;
    }
    
    const response = await api.post('/auth/refresh-token', { refreshToken });
    console.log('Refresh token response:', response);
    
    const { token } = response.data;
    
    if (token) {
      // Update only the token and timestamp
      localStorage.setItem('token', token);
      localStorage.setItem('tokenTimestamp', Date.now().toString());
      console.log('Token refreshed successfully');
      return true;
    }
    
    console.log('Token refresh failed - no token in response');
    return false;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    
    if (error.response) {
      console.error('Refresh token error status:', error.response.status);
      console.error('Refresh token error data:', error.response.data);
    }
    
    return false;
  }
}; 