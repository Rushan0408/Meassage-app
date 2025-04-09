import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getAuthData, clearAuthData } from '../utils/auth';
import { logout, getNotificationCount } from '../services/api';
import NotificationList from './NotificationList';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Get user data from auth
  const { userId, username } = getAuthData();

  useEffect(() => {
    // Close menus when route changes
    setShowMobileMenu(false);
    setShowNotifications(false);
  }, [location.pathname]);
  
  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        if (!userId) return;
        
        const response = await getNotificationCount(userId);
        setUnreadCount(response.data.count);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };
    
    if (userId) {
      fetchUnreadCount();
      // Set up interval to update count
      const interval = setInterval(fetchUnreadCount, 60000); // every minute
      return () => clearInterval(interval);
    }
  }, [userId]);

  const handleLogout = async () => {
    try {
      await logout(userId);
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear auth data and redirect to login
    clearAuthData();
    navigate('/');
  };
  
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
    if (showNotifications) setShowNotifications(false);
  };
  
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showMobileMenu) setShowMobileMenu(false);
    
    // Reset unread count when opening notifications
    if (!showNotifications) {
      setUnreadCount(0);
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/dashboard">
            <h1>Messaging App</h1>
          </Link>
        </div>

        <div className="nav-actions">
          <button 
            className={`notification-button ${showNotifications ? 'active' : ''}`}
            onClick={toggleNotifications}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          <button 
            className={`mobile-menu-btn ${showMobileMenu ? 'active' : ''}`}
            onClick={toggleMobileMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className={`nav-links ${showMobileMenu ? 'active' : ''}`}>
            <Link to="/conversations" className={location.pathname.startsWith('/conversations') ? 'active' : ''}>
              Conversations
            </Link>
            <Link to="/users" className={location.pathname.startsWith('/users') ? 'active' : ''}>
              Users
            </Link>
            <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
              Profile
            </Link>
            <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
              Settings
            </Link>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Notification dropdown */}
      {showNotifications && (
        <div className="notification-dropdown">
          <NotificationList onClose={() => setShowNotifications(false)} />
        </div>
      )}
    </nav>
  );
};

export default Navigation;