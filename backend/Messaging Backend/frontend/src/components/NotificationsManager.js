import { useEffect, useState } from 'react';
import { subscribeToNotifications, onConnect } from '../services/websocket';
import { showToast } from './ui/ToastPortal';
import { getAuthData } from '../utils/auth';

const NotificationsManager = () => {
  const [notifications, setNotifications] = useState([]);
  const { userId } = getAuthData();

  useEffect(() => {
    if (!userId) return;

    // Set up WebSocket connection and notification subscription
    const setupNotifications = () => {
      // Subscribe to user notifications
      const subscription = subscribeToNotifications(handleNotificationReceived);
      
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    };

    // Setup notifications when the WebSocket is connected
    const onConnectHandler = setupNotifications;
    onConnect(onConnectHandler);

    // If already connected, set up immediately
    setupNotifications();

    return () => {
      // Cleanup when component unmounts
    };
  }, [userId]);

  const handleNotificationReceived = (notification) => {
    // Add the new notification to state
    setNotifications(prev => [notification, ...prev]);
    
    // Show toast notification
    showToast(notification.content, notification.type === 'ERROR' ? 'error' : 'info');
  };

  // This component doesn't render anything visible
  return null;
};

export default NotificationsManager; 