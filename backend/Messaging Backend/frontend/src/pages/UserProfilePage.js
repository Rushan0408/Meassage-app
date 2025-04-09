import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, updateUser, updateProfilePicture } from '../services/api';
import { getAuthData } from '../utils/auth';
import './UserProfilePage.css';

const UserProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId: currentUserId } = getAuthData();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    status: ''
  });

  const userId = id || currentUserId;
  const isCurrentUser = userId === currentUserId;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await getUserById(userId);
        setUser(response.data);
        setFormData({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          email: response.data.email || '',
          status: response.data.status || 'offline'
        });
      } catch (err) {
        setError('Failed to load user profile. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(userId, formData);
      setIsEditing(false);
      // Refresh user data
      const response = await getUserById(userId);
      setUser(response.data);
    } catch (error) {
      setError('Failed to update profile. Please try again.');
      console.error(error);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const response = await updateProfilePicture(userId, file);
      // Refresh user data
      setUser({
        ...user,
        profilePicture: response.data.profilePicture
      });
    } catch (error) {
      setError('Failed to update profile picture. Please try again.');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading user profile...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!user) {
    return <div className="not-found-container">User not found</div>;
  }

  return (
    <div className="user-profile-page">
      <div className="profile-header">
        <div className="profile-picture-container">
          {user.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt={`${user.firstName}'s profile`} 
              className="profile-picture"
            />
          ) : (
            <div className="default-avatar">
              {user.firstName && user.firstName.charAt(0)}
              {user.lastName && user.lastName.charAt(0)}
            </div>
          )}
          
          {isCurrentUser && (
            <label className="change-picture-btn">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                style={{ display: 'none' }}
              />
              Change Picture
            </label>
          )}
        </div>
        
        <div className="profile-info">
          <h2>{user.firstName} {user.lastName}</h2>
          <p className="username">@{user.username}</p>
          <p className="status">Status: {user.status || 'Offline'}</p>
          
          {isCurrentUser && !isEditing && (
            <button 
              className="edit-profile-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
      
      {isEditing && (
        <div className="edit-profile-form">
          <h3>Edit Profile</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="save-btn"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="profile-details">
        <h3>Contact Information</h3>
        <div className="detail-item">
          <span className="detail-label">Email:</span>
          <span className="detail-value">{user.email}</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Last Seen:</span>
          <span className="detail-value">
            {user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
