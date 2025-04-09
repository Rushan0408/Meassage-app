import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword, logout } from '../services/api';
import { getAuthData } from '../utils/auth';
import './SettingsPage.css';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { userId } = getAuthData();
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notifications, setNotifications] = useState({
    newMessages: true,
    mentions: true,
    groupInvites: true
  });
  
  const [theme, setTheme] = useState('light');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });
  };
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications({
      ...notifications,
      [name]: checked
    });
  };
  
  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      await resetPassword(userId, passwordForm.newPassword);
      setSuccess('Password updated successfully');
      setError('');
      
      // Clear form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setError('Failed to update password. Please try again.');
      setSuccess('');
      console.error(error);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout(userId);
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      
      // Redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="settings-page">
      <h2>Settings</h2>
      
      {error && <div className="error-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}
      
      <div className="settings-section">
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="settings-form">
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <button type="submit" className="save-btn">Update Password</button>
        </form>
      </div>
      
      <div className="settings-section">
        <h3>Notifications</h3>
        <div className="settings-group">
          <div className="notification-option">
            <input
              type="checkbox"
              id="newMessages"
              name="newMessages"
              checked={notifications.newMessages}
              onChange={handleNotificationChange}
            />
            <label htmlFor="newMessages">New Messages</label>
          </div>
          
          <div className="notification-option">
            <input
              type="checkbox"
              id="mentions"
              name="mentions"
              checked={notifications.mentions}
              onChange={handleNotificationChange}
            />
            <label htmlFor="mentions">Mentions</label>
          </div>
          
          <div className="notification-option">
            <input
              type="checkbox"
              id="groupInvites"
              name="groupInvites"
              checked={notifications.groupInvites}
              onChange={handleNotificationChange}
            />
            <label htmlFor="groupInvites">Group Invites</label>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Theme</h3>
        <div className="theme-selector">
          <select value={theme} onChange={handleThemeChange}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System Default</option>
          </select>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Account</h3>
        <div className="account-actions">
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
          
          <button className="delete-account-button">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 