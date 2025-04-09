import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/api';
import { getAuthData } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import './NotificationList.css';

const NotificationList = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userId } = getAuthData();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications(userId, 0, 20, false);
      setNotifications(response.data.content || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load notifications');
      setLoading(false);
      console.error('Error fetching notifications:', err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    if (notification.conversationId) {
      navigate(`/conversations/${notification.conversationId}`);
      if (onClose) onClose();
    }
  };

  const getNotificationTime = (date) => {
    const notificationDate = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now - notificationDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
  };

  if (loading) return <div className="notification-loading">Loading notifications...</div>;
  if (error) return <div className="notification-error">{error}</div>;

  return (
    <div className="notification-list">
      <div className="notification-header">
        <h3>Notifications</h3>
        {notifications.some(notification => !notification.read) && (
          <button className="mark-all-read" onClick={handleMarkAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="no-notifications">
          No notifications
        </div>
      ) : (
        <div className="notifications-container">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-avatar">
                {notification.senderImage ? (
                  <img src={notification.senderImage} alt={notification.senderName || 'User'} />
                ) : (
                  <div className="default-avatar">
                    {(notification.senderName || 'U').charAt(0)}
                  </div>
                )}
              </div>
              <div className="notification-content">
                <div className="notification-message">
                  {notification.content}
                </div>
                <div className="notification-time">
                  {getNotificationTime(notification.createdAt)}
                </div>
              </div>
              {!notification.read && <div className="notification-indicator"></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationList; 