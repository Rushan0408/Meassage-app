import React, { useState, useEffect } from 'react';
import { forceReconnect, onConnect, onDisconnect, isWebSocketConnected } from '../services/websocket';

/**
 * Component that monitors WebSocket connection status and provides a reconnect button
 * Place this component at the top of your layout for visibility when connection issues occur
 */
const ConnectionStatusMonitor = () => {
  const [status, setStatus] = useState(isWebSocketConnected() ? 'connected' : 'connecting');
  const [visible, setVisible] = useState(false);

  // Check connection periodically
  useEffect(() => {
    const checkConnection = () => {
      const currentStatus = isWebSocketConnected() ? 'connected' : 'disconnected';
      setStatus(currentStatus);
      setVisible(currentStatus !== 'connected');
    };

    // Check immediately
    checkConnection();
    
    // Then check periodically
    const interval = setInterval(checkConnection, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // Register for connection events
  useEffect(() => {
    const handleConnect = () => {
      setStatus('connected');
      setVisible(false);
    };
    
    const handleDisconnect = () => {
      setStatus('disconnected');
      setVisible(true);
    };
    
    // Register callbacks
    const connectId = onConnect(handleConnect);
    const disconnectId = onDisconnect(handleDisconnect);
    
    return () => {
      // Unregister callbacks when component unmounts
      if (connectId) connectId.unsubscribe();
      if (disconnectId) disconnectId.unsubscribe();
    };
  }, []);

  const handleReconnect = () => {
    setStatus('connecting');
    forceReconnect();
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-100 p-2 z-50 flex items-center justify-center space-x-2">
      <div className="flex items-center">
        {status === 'disconnected' ? (
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
        ) : (
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2 animate-pulse"></div>
        )}
        
        <span className="text-sm">
          {status === 'disconnected' 
            ? 'Connection lost' 
            : 'Connecting...'}
        </span>
        
        {status === 'disconnected' && (
          <button 
            onClick={handleReconnect}
            className="ml-2 text-blue-600 text-sm underline hover:text-blue-800"
          >
            Reconnect
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatusMonitor; 