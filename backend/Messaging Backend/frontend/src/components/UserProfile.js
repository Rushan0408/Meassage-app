import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, updateUser, updateUserStatus, updateProfilePicture } from '../services/api';
import { getAuthData, clearAuthData } from '../utils/auth';
import './UserProfile.css';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { userId } = getAuthData();
  
  // Editable form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: ''
  });

  // Status options
  const statusOptions = ['online', 'offline', 'away'];

  useEffect(() => {
    fetchUserProfile();
  }, [id]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await getUserById(id);
      setUser(response.data);
      setFormData({
        username: response.data.username,
        email: response.data.email,
        firstName: response.data.firstName,
        lastName: response.data.lastName
      });
      setError('');
    } catch (err) {
      setError('Failed to load user profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // If we're exiting edit mode, reset the form data
      setFormData({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await updateUser(id, formData);
      setUser(response.data);
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const response = await updateUserStatus(id, status);
      setUser(response.data);
    } catch (err) {
      setError('Failed to update status. Please try again.');
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!selectedFile) return;
    
    setUploadingImage(true);
    try {
      const response = await updateProfilePicture(id, selectedFile);
      setUser({
        ...user,
        profilePicture: response.data.pictureUrl
      });
      setSelectedFile(null);
    } catch (err) {
      setError('Failed to upload profile picture. Please try again.');
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = () => {
    clearAuthData();
    navigate('/');
  };

  if (loading && !user) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!user) {
    return <div className="error">User not found</div>;
  }

  // Check if this is the current user's profile
  const isCurrentUser = userId === id;

  return (
    <div className="user-profile-container">
      <div className="user-profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={`${user.username}'s profile`} />
            ) : (
              <div className="default-avatar">
                {user.firstName && user.lastName 
                  ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
                  : user.username.substring(0, 2)}
              </div>
            )}
          </div>
          
          {isCurrentUser && (
            <div className="profile-image-upload">
              <input 
                type="file" 
                id="profile-image" 
                onChange={handleFileChange} 
                accept="image/*"
              />
              <label htmlFor="profile-image">
                Change Photo
              </label>
              {selectedFile && (
                <button 
                  onClick={handleUploadProfilePicture}
                  disabled={uploadingImage}
                  className="upload-button"
                >
                  {uploadingImage ? 'Uploading...' : 'Upload'}
                </button>
              )}
            </div>
          )}
          
          <div className="profile-status">
            <span className={`status-indicator ${user.status}`}></span>
            <span className="status-text">{user.status}</span>
            
            {isCurrentUser && (
              <div className="status-dropdown">
                <select 
                  value={user.status} 
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="profile-edit-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="save-button">
                Save Changes
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={handleEditToggle}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <h1>{user.firstName} {user.lastName}</h1>
            <p className="username">@{user.username}</p>
            <p className="email">{user.email}</p>
            <p className="last-seen">
              Last seen: {user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'N/A'}
            </p>
            
            {isCurrentUser && (
              <div className="profile-actions">
                <button 
                  className="edit-button"
                  onClick={handleEditToggle}
                >
                  Edit Profile
                </button>
                <button 
                  className="logout-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 