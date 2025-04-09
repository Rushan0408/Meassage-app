import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getConversations, markConversationAsRead } from '../services/api';
import { getAuthData } from '../utils/auth';
import { formatDate } from '../utils/formatDate';
import './ConversationsPage.css';

const ConversationsPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { userId } = getAuthData();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await getConversations(userId);
        setConversations(response.data.content);
        setError('');
      } catch (err) {
        setError('Failed to load conversations. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchConversations();
    }
  }, [userId]);

  const handleMarkAsRead = async (conversationId) => {
    try {
      await markConversationAsRead(conversationId, { userId });
      
      // Update the local state to show the conversation as read
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  };

  // Function to get display name for a conversation
  const getDisplayName = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.name;
    } else {
      // For direct conversations, show the other participant's name
      const otherParticipant = conversation.participants.find(p => p.id !== userId);
      return otherParticipant 
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}` 
        : 'Unknown User';
    }
  };

  // Function to get the last message preview
  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    return conversation.lastMessage.content.length > 30
      ? `${conversation.lastMessage.content.substring(0, 30)}...`
      : conversation.lastMessage.content;
  };

  if (loading) {
    return <div className="loading-container">Loading conversations...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="no-conversations-container">
        <h2>No Conversations Yet</h2>
        <p>Start chatting with someone to create a new conversation.</p>
        <Link to="/conversations/create" className="new-conversation-btn">Start New Conversation</Link>
      </div>
    );
  }

  return (
    <div className="conversations-page">
      <div className="conversations-header">
        <h2>Your Conversations</h2>
        <Link to="/conversations/create" className="new-conversation-btn">
          New Conversation
        </Link>
      </div>
      
      <div className="conversations-list">
        {conversations.map(conversation => (
          <Link 
            key={conversation.id} 
            to={`/conversations/${conversation.id}`}
            className={`conversation-item ${conversation.unreadCount > 0 ? 'unread' : ''}`}
            onClick={() => conversation.unreadCount > 0 && handleMarkAsRead(conversation.id)}
          >
            <div className="conversation-avatar">
              {conversation.type === 'group' ? (
                <div className="group-avatar">
                  {conversation.name ? conversation.name.charAt(0) : 'G'}
                </div>
              ) : (
                <div className="user-avatar">
                  {getDisplayName(conversation).charAt(0)}
                </div>
              )}
            </div>
            
            <div className="conversation-details">
              <div className="conversation-header">
                <h3 className="conversation-name">{getDisplayName(conversation)}</h3>
                <span className="conversation-time">
                  {conversation.lastMessage ? formatDate(conversation.lastMessage.timestamp) : ''}
                </span>
              </div>
              
              <div className="conversation-preview">
                <p className="last-message">
                  {getLastMessagePreview(conversation)}
                </p>
                
                {conversation.unreadCount > 0 && (
                  <span className="unread-count">{conversation.unreadCount}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ConversationsPage; 