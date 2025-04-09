import axios from 'axios';
import { isTokenExpired, refreshToken, clearAuthData } from '../utils/auth';

const API_URL = 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Simple request throttling
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // ms between requests

// Add request interceptor to add authentication token and throttle requests
api.interceptors.request.use(
  async (config) => {
    // Implement basic throttling
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();
    
    // Check if token is expired, and refresh if needed
    if (isTokenExpired() && config.url !== '/auth/login' && config.url !== '/auth/refresh-token') {
      const refreshSuccess = await refreshToken();
      if (!refreshSuccess) {
        // Clear auth data if token can't be refreshed
        clearAuthData();
        
        // Redirect to login page if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
      }
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Implement retry logic for network errors and 5xx errors
    if ((error.code === 'ERR_NETWORK' || 
         (error.response && error.response.status >= 500)) && 
        !originalRequest._retry) {
      
      originalRequest._retry = true;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Retrying request: ${originalRequest.url}`);
      return api(originalRequest);
    }
    
    // Log detailed error information
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers
      });
      
      // If unauthorized, clear auth and redirect to login
      if (error.response.status === 401 && 
          error.config.url !== '/auth/login' && 
          error.config.url !== '/auth/refresh-token') {
        clearAuthData();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error Message:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const login = (email, password) => 
  api.post('/auth/login', { email, password });

export const register = (userData) => 
  api.post('/auth/register', userData);

export const getCurrentUser = () => 
  api.get('/auth/me');

export const logout = (userId) => 
  api.post('/auth/logout', { userId });

export const resetPassword = (email, newPassword) =>
  api.post('/auth/reset-password', { email, newPassword });

// User API
export const getUsers = (search = '', page = 0, size = 10) => 
  api.get('/users', { 
    params: { 
      search: search ? search.trim() : undefined,
      page,
      size
    } 
  });

export const getAllUsers = () => 
  api.get('/users/all');

export const getUserById = (userId) => 
  api.get(`/users/${userId}`);

export const updateUser = (userId, userData) => 
  api.put(`/users/${userId}`, userData);

export const updateUserStatus = (userId, status) => 
  api.put('/users/status', { userId, status });

export const updateProfilePicture = (userId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  
  return api.put('/users/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Conversation API
export const getConversations = (userId, page = 0, size = 20) => 
  api.get('/conversations', { params: { userId, page, size } });

export const getConversationById = (conversationId) => {
  // Validate conversationId to prevent unnecessary API calls
  if (!conversationId || conversationId === 'new') {
    return Promise.reject({
      response: {
        status: 404,
        data: { 
          message: 'Invalid conversation ID. Use createConversation to create a new conversation.'
        }
      }
    });
  }
  return api.get(`/conversations/${conversationId}`);
};

export const createConversation = (data) => 
  api.post('/conversations', data);

export const updateConversation = (conversationId, data) => 
  api.put(`/conversations/${conversationId}`, data);

export const deleteConversation = (conversationId, userId) =>
  api.delete(`/conversations/${conversationId}`, { params: { userId } });

// Request debouncing - track conversation requests to prevent overloading
const activeRequests = {};
const requestQueue = {};

export const getMessages = (conversationId, page = 0, size = 20, before = null) => {
  // Create a unique key for this request
  const requestKey = `${conversationId}_${page}_${before || 'latest'}`;
  
  // If there's an active request for the same data, queue this one
  if (activeRequests[requestKey]) {
    console.log(`Request already in progress: ${requestKey}, queuing...`);
    
    // Create a promise that will be resolved when the active request completes
    return new Promise((resolve, reject) => {
      // Initialize queue for this key if it doesn't exist
      if (!requestQueue[requestKey]) {
        requestQueue[requestKey] = [];
      }
      
      // Add this request to the queue
      requestQueue[requestKey].push({ resolve, reject });
    });
  }
  
  // Default to smaller page size for performance
  const adjustedSize = Math.min(size, 20);
  
  const params = { 
    page, 
    size: adjustedSize
  };
  
  if (before) {
    params.before = before;
  }
  
  // Mark this request as active
  activeRequests[requestKey] = true;
  
  return api.get(`/conversations/${conversationId}/messages`, { params })
    .then(response => {
      // Process the request queue for this key
      if (requestQueue[requestKey] && requestQueue[requestKey].length > 0) {
        // Resolve all queued requests with the same response
        requestQueue[requestKey].forEach(queued => {
          queued.resolve({ ...response });
        });
        
        // Clear the queue
        delete requestQueue[requestKey];
      }
      
      // Clear the active request flag
      delete activeRequests[requestKey];
      
      return response;
    })
    .catch(error => {
      // If there are queued requests, reject them all with the same error
      if (requestQueue[requestKey] && requestQueue[requestKey].length > 0) {
        requestQueue[requestKey].forEach(queued => {
          queued.reject(error);
        });
        
        // Clear the queue
        delete requestQueue[requestKey];
      }
      
      // Clear the active request flag
      delete activeRequests[requestKey];
      
      throw error;
    });
};

export const sendMessage = async (conversationId, messageData, retryCount = 0) => {
  try {
    return await api.post(`/conversations/${conversationId}/messages`, messageData);
  } catch (error) {
    // For network errors, retry up to 2 times
    if (error.code === 'ERR_NETWORK' && retryCount < 2) {
      console.log(`Retrying sendMessage (${retryCount + 1}/2)...`);
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return sendMessage(conversationId, messageData, retryCount + 1);
    }
    throw error;
  }
};

export const editMessage = (messageId, content) =>
  api.put(`/messages/${messageId}`, { content });

export const deleteMessage = (messageId) =>
  api.delete(`/messages/${messageId}`);

export const markMessageAsRead = (messageId) =>
  api.put(`/messages/${messageId}/read`);

// User Conversation API
export const updateUserConversationSettings = (conversationId, settings) =>
  api.put(`/user-conversations/${conversationId}`, settings);

export const markConversationAsRead = async (conversationId, userId, retryCount = 0) => {
  try {
    // Handle both object format (like {userId: 'abc123'}) and string format
    const userIdValue = typeof userId === 'object' && userId !== null ? userId.userId : userId;
    
    // Validate parameters
    if (!conversationId || !userIdValue) {
      console.warn('Invalid parameters for markConversationAsRead:', { conversationId, userIdValue });
      return Promise.reject(new Error('Invalid parameters: conversationId and userId are required'));
    }
    
    // Try sending a request body instead of query parameter to avoid encoding issues
    return await api.put(`/user-conversations/${conversationId}/read`, { userId: userIdValue });
  } catch (error) {
    // Log the error
    console.error(`Error marking conversation as read (attempt ${retryCount + 1}):`, error);
    
    // For network errors or 500s, retry up to 2 times with exponential backoff
    if ((error.code === 'ERR_NETWORK' || 
        (error.response && error.response.status >= 500)) && 
       retryCount < 2) {
      // Wait longer between each retry (1s, 3s)
      const delay = 1000 * Math.pow(3, retryCount);
      console.log(`Retrying markConversationAsRead in ${delay}ms (${retryCount + 1}/2)...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return markConversationAsRead(conversationId, userId, retryCount + 1);
    }
    
    // If we reached maximum retries or it's not a retriable error, throw it
    throw error;
  }
};

export const markAllMessagesAsRead = async (conversationId, userId, retryCount = 0) => {
  try {
    // Handle both object format (like {userId: 'abc123'}) and string format
    const userIdValue = typeof userId === 'object' && userId !== null ? userId.userId : userId;
    
    // Validate parameters
    if (!conversationId || !userIdValue) {
      console.warn('Invalid parameters for markAllMessagesAsRead:', { conversationId, userIdValue });
      return Promise.reject(new Error('Invalid parameters: conversationId and userId are required'));
    }
    
    // Use request body instead of query parameter for consistency
    return await api.put(`/messages/mark-all-read/${conversationId}`, { userId: userIdValue });
  } catch (error) {
    // Log the error
    console.error(`Error marking all messages as read (attempt ${retryCount + 1}):`, error);
    
    // For network errors or 500s, retry up to 2 times with exponential backoff
    if ((error.code === 'ERR_NETWORK' || 
        (error.response && error.response.status >= 500)) && 
       retryCount < 2) {
      // Wait longer between each retry (1s, 3s)
      const delay = 1000 * Math.pow(3, retryCount);
      console.log(`Retrying markAllMessagesAsRead in ${delay}ms (${retryCount + 1}/2)...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return markAllMessagesAsRead(conversationId, userId, retryCount + 1);
    }
    
    // If we reached maximum retries or it's not a retriable error, throw it
    throw error;
  }
};

// Notification API
export const getNotifications = (userId, page = 0, size = 20, unreadOnly = false) =>
  api.get('/notifications', { params: { userId, page, size, unreadOnly } });

export const getNotificationCount = (userId) =>
  api.get('/notifications/count', { params: { userId } });

export const markNotificationAsRead = (notificationId) =>
  api.put(`/notifications/${notificationId}/read`);

export const markAllNotificationsAsRead = (userId) =>
  api.put('/notifications/read-all', null, { params: { userId } });

export default api; 