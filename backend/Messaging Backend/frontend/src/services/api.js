import axios from 'axios';
import { isTokenExpired, refreshToken, clearAuthData } from '../utils/auth';

const API_URL = 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000, // 15 second timeout
  withCredentials: true // Include cookies in cross-origin requests
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
    
    // Skip token check for auth endpoints
    if (config.url === '/auth/login' || config.url === '/auth/register' || config.url === '/auth/refresh-token') {
      return config;
    }
    
    // Check if token is expired, and refresh if needed
    if (isTokenExpired()) {
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
    
    // Skip auth related errors for login/register endpoints
    if (originalRequest && (
        originalRequest.url === '/auth/login' || 
        originalRequest.url === '/auth/register')) {
      return Promise.reject(error);
    }
    
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
export const login = (email, password) => {
  // Try to log request details to help debug
  console.log('Attempting login with:', { email, password: '***' });
  
  return api.post('/auth/login', { email, password }, {
    headers: {
      'Content-Type': 'application/json'
    },
    // Try without withCredentials first as it might be causing CORS issues
    withCredentials: false
  });
}

export const register = (userData) => 
  api.post('/auth/register', userData, {
    headers: {
      'Content-Type': 'application/json'
    },
    withCredentials: false
  });

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
const messageCache = {}; // Simple cache for messages

// Cache configuration
const messageCacheExpiry = {
  direct: 60 * 1000,    // 60 seconds for direct messages
  group: 30 * 1000      // 30 seconds for group chats - refresh more often
};

// Message fetch limits
const messagePageSizes = {
  direct: 50,           // Standard 50 messages for direct chats
  group: 40             // Fewer messages for group chats to improve load time
};

/**
 * Get messages for a conversation with caching and background refresh
 */
export const getMessages = async (conversationId, { page = 0, size = 50, before = null, forceRefresh = false } = {}) => {
  // Validate inputs
  if (!conversationId) {
    throw new Error('conversationId is required for getMessages');
  }

  // Determine if this is a group chat
  const isGroupChat = typeof conversationId === 'string' && conversationId.startsWith('group_');
  const chatType = isGroupChat ? 'group' : 'direct';
  
  // Adjust fetch parameters based on chat type
  const cacheExpiryTime = messageCacheExpiry[chatType];
  const batchSize = Math.min(size, messagePageSizes[chatType]);
  const timeoutMs = isGroupChat ? 10000 : 15000; // 10s for group, 15s for direct
  
  // Create a cache key
  const cacheKey = `messages_${conversationId}_${page}_${batchSize}_${before || ''}`;
  
  // Check if we already have a request in progress for this exact data
  if (activeRequests[cacheKey]) {
    console.debug(`Reusing in-flight request for ${cacheKey}`);
    try {
      const response = await activeRequests[cacheKey];
      return response;
    } catch (error) {
      // If in-flight request fails, continue to try a new one
      console.warn(`In-flight request for ${cacheKey} failed, will try again`);
    }
  }
  
  // Check cache for a valid response
  const cachedResponse = messageCache[cacheKey];
  const now = Date.now();
  const cacheAge = cachedResponse ? now - cachedResponse.timestamp : Infinity;
  const isCacheFresh = cacheAge < cacheExpiryTime;
  
  // Use cache if it's fresh and we're not forcing a refresh
  if (cachedResponse && isCacheFresh && !forceRefresh) {
    console.debug(`Using fresh cache for ${cacheKey} (${Math.round(cacheAge / 1000)}s old)`);
    
    // If the cache is getting stale (over half its lifetime), refresh in background
    if (cacheAge > cacheExpiryTime / 2) {
      setTimeout(() => {
        _refreshMessageCache(conversationId, page, batchSize, before, cacheKey);
      }, 50);
    }
    
    return cachedResponse.data;
  }
  
  // If cache exists but is stale (and we haven't been asked to force refresh),
  // trigger background refresh and return stale data
  if (cachedResponse && !forceRefresh) {
    console.debug(`Using stale cache for ${cacheKey} (${Math.round(cacheAge / 1000)}s old) while refreshing`);
    
    // Start refresh in background
    setTimeout(() => {
      _refreshMessageCache(conversationId, page, batchSize, before, cacheKey);
    }, 10);
    
    return cachedResponse.data;
  }
  
  // Need to fetch fresh data - build request
  console.debug(`Fetching fresh data for ${cacheKey}`);
  const params = { page, size: batchSize };
  if (before) {
    params.before = before;
  }
  
  try {
    // Create the request with timeout
    const request = api.get(`/conversations/${conversationId}/messages`, {
      params,
      timeout: timeoutMs
    });
    
    // Store the promise to deduplicate requests
    activeRequests[cacheKey] = request;
    
    // Wait for response
    const response = await request;
    
    // Update cache
    messageCache[cacheKey] = {
      data: response,
      timestamp: now
    };
    
    return response;
  } catch (error) {
    // Handle errors - try to use cached data if available
    if (cachedResponse) {
      console.warn(`Error fetching ${cacheKey}, falling back to cached data:`, error.message || error);
      return cachedResponse.data;
    }
    
    // No cached data to fall back to
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Request timeout (${timeoutMs}ms) getting messages for ${conversationId}`);
    } else if (error.message?.includes('Network Error')) {
      throw new Error(`Network error getting messages for ${conversationId}. Please check your connection.`);
    }
    
    // Rethrow other errors
    throw error;
  } finally {
    // Clean up
    delete activeRequests[cacheKey];
  }
};

// Clear message cache for a conversation when a new message is sent
const clearConversationCache = (conversationId) => {
  // Remove all cache entries for this conversation
  Object.keys(messageCache).forEach(key => {
    if (key.startsWith(`${conversationId}_`)) {
      delete messageCache[key];
    }
  });
};

export const sendMessage = async (conversationId, messageData, retryCount = 0) => {
  try {
    const response = await api.post(`/conversations/${conversationId}/messages`, messageData);
    // Clear cache for this conversation
    clearConversationCache(conversationId);
    return response;
  } catch (error) {
    if ((error.code === 'ERR_NETWORK' || 
        (error.response && error.response.status >= 500)) && 
        retryCount < 2) {
      
      console.log(`Retrying sendMessage (${retryCount + 1}/2)...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      
      // Retry
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

/**
 * Background refresh of message cache
 * @private
 */
async function _refreshMessageCache(conversationId, page, size, before, cacheKey) {
  // Skip refresh if we're offline
  if (navigator.onLine === false) {
    console.debug(`Skipping refresh for ${cacheKey} - offline`);
    return;
  }
  
  // Skip if already being refreshed
  if (activeRequests[cacheKey]) {
    console.debug(`Skipping duplicate refresh for ${cacheKey}`);
    return;
  }
  
  // Determine if this is a group chat
  const isGroupChat = typeof conversationId === 'string' && conversationId.startsWith('group_');
  
  // Set appropriate batch size and timeout based on conversation type
  const batchSize = isGroupChat ? 30 : 40; // Smaller batch for group chats
  const timeoutMs = isGroupChat ? 8000 : 12000; // Shorter timeout for group chats
  
  // Set up request parameters
  const params = { page, size: batchSize };
  if (before) {
    params.before = before;
  }
  
  // Create the request
  const request = api.get(`/conversations/${conversationId}/messages`, {
    params,
    timeout: timeoutMs
  });
  
  // Track this request to prevent duplicates
  activeRequests[cacheKey] = request;
  
  try {
    console.debug(`Background refreshing ${cacheKey}`);
    const response = await request;
    
    // Update cache with fresh data
    messageCache[cacheKey] = {
      data: response,
      timestamp: Date.now()
    };
    
    console.debug(`Successfully refreshed cache for ${cacheKey}`);
  } catch (error) {
    // Don't throw for background refreshes, just log the error
    if (error.code === 'ECONNABORTED') {
      console.warn(`Background refresh timeout (${timeoutMs}ms) for ${cacheKey}`);
    } else if (error.message && error.message.includes('Network Error')) {
      console.warn(`Network error during background refresh for ${cacheKey}`);
    } else {
      console.warn(`Error during background refresh for ${cacheKey}:`, error.message || error);
    }
  } finally {
    // Always clean up
    delete activeRequests[cacheKey];
  }
}

// Mark conversation as read
export const markConversationAsRead = async (conversationId, userId, retryCount = 0) => {
  try {
    // Handle both object format (like {userId: 'abc123'}) and string format
    const userIdValue = typeof userId === 'object' && userId !== null ? userId.userId : userId;
    
    // Validate parameters
    if (!conversationId || !userIdValue) {
      console.warn('Invalid parameters for markConversationAsRead:', { conversationId, userIdValue });
      return Promise.reject(new Error('Invalid parameters: conversationId and userId are required'));
    }
    
    // Send userId in request body instead of query parameter
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
    
    // Send userId in request body instead of query parameter
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