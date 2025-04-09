import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createConversation, getAllUsers, getAuthData } from '../services/api';
import './NewConversation.css';

const NewConversation = () => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { userId } = getAuthData();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getAllUsers();
        // Filter out current user
        const filteredUsers = response.filter(user => user.id !== userId);
        setUsers(filteredUsers);
      } catch (err) {
        setError('Failed to load users. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userId]);

  const handleUserSelect = (user) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      // If not a group, only allow selecting one user at a time
      if (!isGroup) {
        setSelectedUsers([user]);
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    }
  };

  const toggleGroupConversation = () => {
    setIsGroup(!isGroup);
    // Clear selected users when toggling
    setSelectedUsers([]);
    setGroupName('');
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    if (isGroup && !groupName.trim()) {
      setError('Please provide a group name');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const participantIds = [...selectedUsers.map(user => user.id), userId];
      
      const conversationData = {
        type: isGroup ? 'group' : 'direct',
        name: isGroup ? groupName : null,
        participants: participantIds
      };

      const response = await createConversation(conversationData);
      
      // Navigate to the new conversation
      navigate(`/conversations/${response.data.id}`);
    } catch (err) {
      setError('Failed to create conversation. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="new-conversation-container">
      <div className="new-conversation-header">
        <h2>New Conversation</h2>
        <div className="conversation-type-toggle">
          <button 
            className={!isGroup ? 'active' : ''} 
            onClick={() => setIsGroup(false)}
          >
            Direct Message
          </button>
          <button 
            className={isGroup ? 'active' : ''} 
            onClick={() => setIsGroup(true)}
          >
            Group Chat
          </button>
        </div>
      </div>

      {isGroup && (
        <div className="group-name-input">
          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="users-list">
        <h3>Select {isGroup ? 'participants' : 'a user'}</h3>
        {users.length === 0 ? (
          <div className="no-users">No users available</div>
        ) : (
          users.map(user => (
            <div 
              key={user.id} 
              className={`user-item ${selectedUsers.some(u => u.id === user.id) ? 'selected' : ''}`}
              onClick={() => handleUserSelect(user)}
            >
              <div className="user-avatar">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.firstName} />
                ) : (
                  <div className="default-avatar">
                    {user.firstName && user.firstName[0]}
                    {user.lastName && user.lastName[0]}
                  </div>
                )}
              </div>
              <div className="user-details">
                <h4>{user.firstName} {user.lastName}</h4>
                <p>{user.email}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="action-buttons">
        <button 
          className="cancel-btn" 
          onClick={() => navigate('/conversations')}
        >
          Cancel
        </button>
        <button 
          className="create-btn" 
          onClick={handleCreateConversation}
          disabled={selectedUsers.length === 0 || (isGroup && !groupName.trim())}
        >
          Create Conversation
        </button>
      </div>
    </div>
  );
};

export default NewConversation; 