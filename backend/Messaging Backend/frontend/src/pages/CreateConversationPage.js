import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createConversation, getAllUsers } from '../services/api';
import { getAuthData } from '../utils/auth';
import { showToast } from '../components/ui/ToastPortal';
import './CreateConversationPage.css';

const CreateConversationPage = () => {
  const [name, setName] = useState('');
  const [type, setType] = useState('direct');
  const [participantIds, setParticipantIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const navigate = useNavigate();
  const { userId } = getAuthData();

  // Fetch all users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await getAllUsers();
        // Filter out current user
        const filteredUsers = response.data.filter(user => user.id !== userId);
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        showToast('Failed to load users', 'error');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [userId]);

  const handleUserSelect = (selectedUserId) => {
    setParticipantIds(prev => {
      // If already selected, remove it
      if (prev.includes(selectedUserId)) {
        return prev.filter(id => id !== selectedUserId);
      } 
      // If direct message, replace any existing selection
      else if (type === 'direct') {
        return [selectedUserId];
      } 
      // Otherwise add to selection
      else {
        return [...prev, selectedUserId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name && type === 'group') {
      showToast('Please enter a group name', 'error');
      return;
    }
    
    if (participantIds.length === 0) {
      showToast('Please select at least one participant', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      // For direct messages, ensure exactly 2 participants (current user + selected user)
      const participants = type === 'direct' 
        ? [userId, ...participantIds].slice(0, 2)
        : [userId, ...participantIds];
      
      const response = await createConversation({
        type,
        name: type === 'direct' ? null : name,
        participants
      });
      
      showToast('Conversation created successfully', 'success');
      
      // Navigate to the new conversation
      navigate(`/conversations/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      showToast('Failed to create conversation', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Clear selections when type changes
  useEffect(() => {
    setParticipantIds([]);
  }, [type]);
  
  return (
    <div className="create-conversation-page">
      <h1>New Conversation</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Type</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="direct"
                checked={type === 'direct'}
                onChange={() => setType('direct')}
              />
              Direct Message
            </label>
            <label>
              <input
                type="radio"
                value="group"
                checked={type === 'group'}
                onChange={() => setType('group')}
              />
              Group Chat
            </label>
          </div>
        </div>
        
        {type === 'group' && (
          <div className="form-group">
            <label htmlFor="name">Group Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              required={type === 'group'}
            />
          </div>
        )}
        
        <div className="form-group">
          <label>Select Participants</label>
          {loadingUsers ? (
            <p className="loading-text">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="empty-text">No users available</p>
          ) : (
            <div className="user-selection-list">
              {users.map(user => (
                <div 
                  key={user.id} 
                  className={`user-item ${participantIds.includes(user.id) ? 'selected' : ''}`}
                  onClick={() => handleUserSelect(user.id)}
                >
                  <div className="user-avatar">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={`${user.firstName} ${user.lastName}`} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.firstName ? user.firstName.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    {participantIds.includes(user.id) && (
                      <div className="checkmark">✓</div>
                    )}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user.firstName} {user.lastName}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={() => navigate('/conversations')}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="create-button"
            disabled={loading || participantIds.length === 0}
          >
            {loading ? 'Creating...' : 'Create Conversation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateConversationPage; 