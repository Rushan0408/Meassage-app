import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { showToast } from '../components/ui/ToastPortal';
import { getAuthData } from '../utils/auth';

let stompClient = null;
let isConnected = false;
let subscriptions = {};
let reconnectTimer = null;
const reconnectInterval = 5000; // 5 seconds
let connectionAttempts = 0;
const maxReconnectAttempts = 5; // Maximum number of reconnect attempts
let heartbeatTimer = null;
const heartbeatInterval = 30000; // 30 seconds

// Event callbacks
const callbacks = {
  onConnect: [],
  onDisconnect: [],
  onError: [],
  onMessageReceived: []
};

// Function to check the connection health periodically
const startHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }
  
  heartbeatTimer = setInterval(() => {
    if (stompClient && isConnected) {
      // If the client exists and is supposed to be connected, check if it actually is
      if (!stompClient.connected) {
        console.log('WebSocket health check failed - reconnecting...');
        handleConnectionLoss();
      }
    }
  }, heartbeatInterval);
};

// Handle connection loss
const handleConnectionLoss = () => {
  console.log('Handling connection loss, reconnecting...');
  isConnected = false;
  
  // Cleanup the client
  if (stompClient) {
    try {
      stompClient.deactivate();
    } catch (e) {
      console.warn('Error during client deactivation:', e);
    }
    stompClient = null;
  }
  
  // Attempt to reconnect
  if (!reconnectTimer) {
    const delay = Math.min(reconnectInterval * (connectionAttempts + 1), 30000); // Exponential backoff with max 30s
    console.log(`Scheduling reconnect in ${delay}ms...`);
    
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }
};

// Connect to WebSocket server
export const connect = (onConnected, onError) => {
  if (isConnected && stompClient && stompClient.connected) {
    if (onConnected) onConnected();
    return;
  }
  
  const { token } = getAuthData();
  if (!token) {
    if (onError) onError("Authentication required");
    return;
  }
  
  try {
    // Clear any existing reconnect timers
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    // Create a new STOMP client with minimal configuration to avoid errors
    stompClient = new Client();
    
    // Try using sockJS first, then fall back to raw WebSocket if needed
    const maxAttempts = 2;
    
    const attemptConnection = () => {
      try {
        // Use sockJS for transport for first attempt, raw WebSocket for second
        if (connectionAttempts % 2 === 0) {
          console.log('Attempting SockJS connection...');
          stompClient.webSocketFactory = () => new SockJS('http://localhost:8080/ws/connect');
        } else {
          console.log('Attempting raw WebSocket connection...');
          stompClient.webSocketFactory = () => new WebSocket('ws://localhost:8080/ws/connect');
        }
        
        // Set headers
        stompClient.connectHeaders = { 
          Authorization: `Bearer ${token}` 
        };
        
        // Safely set debug to empty function
        stompClient.debug = () => {};
        
        // Configure reconnect - disabled as we handle it manually
        stompClient.reconnectDelay = 0;
        
        // Configure heartbeat
        stompClient.heartbeatIncoming = 10000;
        stompClient.heartbeatOutgoing = 10000;
        
        stompClient.activate();
      } catch (err) {
        console.error(`Connection attempt failed:`, err);
        connectionAttempts++;
        if (connectionAttempts < maxReconnectAttempts) {
          handleConnectionLoss();
        } else {
          console.error('Max reconnection attempts reached');
          showToast('Failed to connect to messaging service. Please refresh the page.', 'error');
          if (onError) onError("Failed to establish connection after multiple attempts");
        }
      }
    };
    
    // Set up event handlers
    stompClient.onConnect = (frame) => {
      console.log('Connected to WebSocket server');
      isConnected = true;
      connectionAttempts = 0; // Reset after successful connection
      
      // Start the heartbeat check
      startHeartbeat();
      
      // Resubscribe to previous subscriptions after reconnect
      Object.keys(subscriptions).forEach(destination => {
        const callback = subscriptions[destination];
        subscribeToDestination(destination, callback);
      });
      
      // Call connect callback
      if (onConnected) onConnected();
      
      // Trigger all registered connect callbacks
      callbacks.onConnect.forEach(callback => callback(frame));
    };
    
    stompClient.onStompError = (error) => {
      console.error('STOMP protocol error:', error);
      isConnected = false;
      
      // Call error callback
      if (onError) onError(error);
      
      // Trigger all registered error callbacks
      callbacks.onError.forEach(callback => callback(error));
      
      // Attempt to reconnect
      connectionAttempts++;
      if (connectionAttempts < maxReconnectAttempts) {
        handleConnectionLoss();
      } else {
        showToast('Connection error. Please refresh the page.', 'error');
      }
    };
    
    stompClient.onWebSocketError = (error) => {
      console.error('WebSocket error:', error);
      isConnected = false;
      
      // Call error callback
      if (onError) onError(error);
      
      // Trigger all registered error callbacks
      callbacks.onError.forEach(callback => callback(error));
      
      // Attempt to reconnect
      connectionAttempts++;
      
      if (connectionAttempts < maxReconnectAttempts) {
        // Attempt to reconnect with increasing delays
        handleConnectionLoss();
        
        // Show non-intrusive message
        if (connectionAttempts > 1) {
          showToast('Reconnecting to messaging service...', 'info');
        }
      } else {
        showToast('Unable to connect to messaging service. Please refresh the page.', 'error');
      }
    };
    
    stompClient.onWebSocketClose = () => {
      console.log('WebSocket connection closed');
      isConnected = false;
      
      // Trigger all registered disconnect callbacks
      callbacks.onDisconnect.forEach(callback => callback());
      
      // Only attempt to reconnect if it wasn't a deliberate disconnect
      if (stompClient && stompClient.deactivated !== true) {
        connectionAttempts++;
        if (connectionAttempts < maxReconnectAttempts) {
          handleConnectionLoss();
        }
      }
    };
    
    // Start connection attempt
    attemptConnection();
    
  } catch (error) {
    console.error('Error establishing WebSocket connection:', error);
    if (onError) onError(error);
    
    // Attempt to reconnect
    connectionAttempts++;
    if (connectionAttempts < maxReconnectAttempts) {
      handleConnectionLoss();
    }
  }
};

// Disconnect from WebSocket server
export const disconnect = () => {
  // Stop heartbeat
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  
  if (stompClient) {
    try {
      stompClient.deactivated = true; // Mark as deliberate disconnect
      stompClient.deactivate();
    } catch (e) {
      console.warn('Error disconnecting:', e);
    }
    isConnected = false;
    
    // Trigger all registered disconnect callbacks
    callbacks.onDisconnect.forEach(callback => callback());
    
    // Clear subscriptions
    subscriptions = {};
  }
};

// Subscribe to a destination
export const subscribe = (destination, callback) => {
  if (!isConnected) {
    connect(() => subscribeToDestination(destination, callback));
    return null;
  }
  
  return subscribeToDestination(destination, callback);
};

// Internal function to handle subscription
const subscribeToDestination = (destination, callback) => {
  if (!stompClient || !stompClient.connected) return null;
  
  try {
    const subscription = stompClient.subscribe(destination, message => {
      try {
        const payload = JSON.parse(message.body);
        
        // Call the specific callback for this subscription
        if (callback) callback(payload);
        
        // Trigger all registered message callbacks
        callbacks.onMessageReceived.forEach(cb => cb(payload, destination));
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        console.error('Message body:', message.body);
        
        // Try to handle the message even if parsing fails
        if (callback && message.body) {
          try {
            // If it's not JSON, just pass the string
            callback({ content: message.body, type: 'TEXT' });
          } catch (innerError) {
            console.error('Failed to handle message as text:', innerError);
          }
        }
      }
    });
    
    // Store subscription callback for reconnecting
    subscriptions[destination] = callback;
    
    return subscription;
  } catch (error) {
    console.error(`Error subscribing to ${destination}:`, error);
    return null;
  }
};

// Unsubscribe from a destination
export const unsubscribe = (destination) => {
  if (subscriptions[destination]) {
    delete subscriptions[destination];
  }
};

// Send message to server
export const send = (destination, payload) => {
  if (!isConnected) {
    connect(() => sendMessage(destination, payload));
    return;
  }
  
  sendMessage(destination, payload);
};

// Internal function to send messages
const sendMessage = (destination, payload) => {
  if (!stompClient || !stompClient.connected) {
    console.warn('Cannot send message - WebSocket not connected');
    return;
  }
  
  try {
    console.log(`Sending message to ${destination}:`, payload);
    stompClient.publish({
      destination: destination,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('Message sent successfully');
  } catch (error) {
    console.error(`Error sending message to ${destination}:`, error);
  }
};

// Register global event listeners
export const onConnect = (callback) => {
  callbacks.onConnect.push(callback);
};

export const onDisconnect = (callback) => {
  callbacks.onDisconnect.push(callback);
};

export const onError = (callback) => {
  callbacks.onError.push(callback);
};

export const onMessageReceived = (callback) => {
  callbacks.onMessageReceived.push(callback);
};

// Helper functions for specific destinations
export const subscribeToConversation = (conversationId, callback) => {
  return subscribe(`/topic/conversations/${conversationId}`, callback);
};

export const subscribeToNotifications = (callback) => {
  return subscribe('/user/queue/notifications', callback);
};

export const sendTypingStatus = (conversationId, isTyping) => {
  send(`/app/conversations/${conversationId}/typing`, { isTyping });
};

export const sendReadReceipt = (conversationId, messageId) => {
  const { userId } = getAuthData();
  send(`/app/conversations/${conversationId}/read`, { 
    messageId, 
    userId, 
    timestamp: Date.now() 
  });
};

// Get connection status
export const isWebSocketConnected = () => {
  return isConnected && stompClient && stompClient.connected;
};

// Force reconnect
export const forceReconnect = () => {
  console.log('Forcing reconnection...');
  connectionAttempts = 0; // Reset connection attempts
  
  if (stompClient) {
    try {
      stompClient.deactivate();
    } catch (e) {
      console.warn('Error during deactivation:', e);
    }
    stompClient = null;
  }
  isConnected = false;
  
  // Clear any existing timers
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  // Connect immediately
  connect();
};

// Automatically attempt to connect on import
setTimeout(() => {
  connect();
}, 1000);

// Read receipts
export const sendBulkReadReceipt = (conversationId, messageIds) => {
  if (!stompClient || !conversationId || !messageIds || messageIds.length === 0) return;
  
  const userId = getAuthData().userId;
  const destination = `/app/chat/${conversationId}/read-bulk`;
  
  send(destination, { messageIds, userId });
  console.log(`Sent bulk read receipt for ${messageIds.length} messages in conversation ${conversationId}`);
};

export default {
  connect,
  disconnect,
  subscribe,
  unsubscribe,
  send,
  subscribeToConversation,
  subscribeToNotifications,
  sendTypingStatus,
  sendReadReceipt,
  onConnect,
  onDisconnect,
  onError,
  onMessageReceived,
  isWebSocketConnected,
  forceReconnect,
  sendBulkReadReceipt
}; 