import React, { useState, useEffect } from 'react';
import { getConversations, markConversationAsRead } from '../services/api';
import { getAuthData } from '../utils/auth';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/formatDate';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import ConversationSettings from './ConversationSettings';
import './ConversationList.css';

const ConversationList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const { userId } = getAuthData();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async (pageNum = page) => {
    if (!userId) {
      setError('User not authenticated. Please log in.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await getConversations(userId, pageNum, size);
      
      // Handle different response formats
      if (response.data && Array.isArray(response.data)) {
        // If API returns direct array
        setConversations(response.data);
        setTotalPages(1); // Default to 1 page if no pagination info
      } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
        // If API returns paginated response
        setConversations(response.data.content);
        setTotalPages(response.data.totalPages || 1);
      } else if (response.data) {
        // If API returns unexpected but valid format
        console.warn('Unexpected API response format:', response.data);
        setConversations(Array.isArray(response.data) ? response.data : []);
        setTotalPages(1);
      } else {
        // Empty response
        setConversations([]);
        setTotalPages(0);
      }
      
      setError('');
    } catch (err) {
      console.error('Error fetching conversations:', err);
      
      // More descriptive error message
      if (err.response) {
        setError(`Failed to load conversations: ${err.response.status} ${err.response.statusText}`);
      } else if (err.request) {
        setError('Failed to load conversations: No response from server. Please check your connection.');
      } else {
        setError(`Failed to load conversations: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchConversations(newPage);
  };

  const getConversationName = (conversation) => {
    // For direct messages, show the other person's name
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(
        participant => participant.id !== userId
      );
      
      return otherParticipant ? 
        `${otherParticipant.firstName} ${otherParticipant.lastName}` : 
        'Unknown User';
    }
    
    // For group chats, show the group name
    return conversation.name || 'Unnamed Group';
  };

  const hasUnreadMessages = (conversation) => {
    // Check if the user conversation has unread messages
    const userConversation = conversation.userConversations?.find(
      uc => uc.userId === userId
    );
    
    return userConversation?.unreadCount > 0;
  };
  
  const isPinned = (conversation) => {
    // Check if the conversation is pinned for this user
    const userConversation = conversation.userConversations?.find(
      uc => uc.userId === userId
    );
    
    return userConversation?.pinned || false;
  };
  
  const isMuted = (conversation) => {
    // Check if the conversation is muted for this user
    const userConversation = conversation.userConversations?.find(
      uc => uc.userId === userId
    );
    
    return userConversation?.muted || false;
  };
  
  const handleSettingsUpdate = (conversationId, updatedSettings) => {
    // Update the conversation in the UI
    setConversations(prev => 
      prev.map(conv => {
        if (conv.id === conversationId) {
          // Update the user conversation settings
          const updatedUserConversations = conv.userConversations.map(uc => {
            if (uc.userId === userId) {
              return { ...uc, ...updatedSettings };
            }
            return uc;
          });
          
          return { ...conv, userConversations: updatedUserConversations };
        }
        return conv;
      })
    );
  };
  
  const handleMarkAsRead = async (conversationId, event) => {
    event.preventDefault(); // Prevent navigation
    event.stopPropagation(); // Prevent event bubbling
    
    try {
      await markConversationAsRead(conversationId, { userId });
      
      // Update UI
      setConversations(prev => 
        prev.map(conv => {
          if (conv.id === conversationId) {
            // Set unread count to 0 for this conversation
            const updatedUserConversations = conv.userConversations.map(uc => {
              if (uc.userId === userId) {
                return { ...uc, unreadCount: 0 };
              }
              return uc;
            });
            
            return { ...conv, userConversations: updatedUserConversations };
          }
          return conv;
        })
      );
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  };

  // Sort conversations: pinned first, then by last message timestamp
  const sortedConversations = React.useMemo(() => {
    // Return empty array if conversations is null or undefined
    if (!conversations || !Array.isArray(conversations)) {
      return [];
    }
  
    return [...conversations].sort((a, b) => {
      // Handle null or undefined conversations
      if (!a) return 1;
      if (!b) return -1;
    
      // Pinned conversations come first
      if (isPinned(a) && !isPinned(b)) return -1;
      if (!isPinned(a) && isPinned(b)) return 1;
      
      // Then sort by timestamp (most recent first)
      const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
      
      return bTime - aTime;
    });
  }, [conversations]); // Only recalculate when conversations change

  // Safe access to conversation properties
  const safeConversationName = (conversation) => {
    try {
      return getConversationName(conversation);
    } catch (error) {
      console.error('Error getting conversation name:', error);
      return 'Conversation';
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={page === i ? 'active' : ''}
        >
          {i + 1}
        </button>
      );
    }
    
    return (
      <div className="pagination">
        <button 
          onClick={() => handlePageChange(page - 1)} 
          disabled={page === 0}
        >
          Previous
        </button>
        {pages}
        <button 
          onClick={() => handlePageChange(page + 1)} 
          disabled={page === totalPages - 1}
        >
          Next
        </button>
      </div>
    );
  };

  if (loading && conversations.length === 0) {
    return <div className="loading">Loading conversations...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="conversation-list-container">
      <div className="conversation-list-header">
        <h2>Conversations</h2>
        <Link to="/conversations/new" className="new-conversation-btn">
          New Chat
        </Link>
      </div>
      
      {conversations.length === 0 && !loading ? (
        <div className="no-conversations">
          <p>You don't have any conversations yet</p>
          <Link to="/conversations/new" className="start-btn">Start a conversation</Link>
        </div>
      ) : (
        <div className="conversation-list">
          {sortedConversations.map((conversation) => 
            conversation ? (  // Only render if conversation exists
              <Link 
                to={`/conversations/${conversation.id}`} 
                key={conversation.id || Math.random().toString()} // Fallback key
                className={`conversation-item ${hasUnreadMessages(conversation) ? 'unread' : ''} ${isPinned(conversation) ? 'pinned' : ''}`}
              >
                <div className="conversation-avatar">
                  {conversation.type === 'direct' ? (
                    // Direct message, show other user's avatar
                    <div className="user-avatar">
                      {conversation.participants.map(participant => {
                        if (participant.id !== userId) {
                          return participant.profilePicture ? (
                            <img 
                              key={participant.id}
                              src={participant.profilePicture} 
                              alt={`${participant.firstName}'s avatar`} 
                            />
                          ) : (
                            <div key={participant.id} className="default-avatar">
                              {participant.firstName && participant.lastName 
                                ? `${participant.firstName.charAt(0)}${participant.lastName.charAt(0)}`
                                : participant.username.substring(0, 2)}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ) : (
                    // Group chat, show group avatar
                    <div className="group-avatar">
                      {conversation.name ? conversation.name.charAt(0) : 'G'}
                    </div>
                  )}
                </div>
                <div className="conversation-details">
                  <div className="conversation-header">
                    <h3>{safeConversationName(conversation)}</h3>
                    <div className="conversation-indicators">
                      {isPinned(conversation) && (
                        <span className="pin-indicator" title="Pinned">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="12" 
                            height="12" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <line x1="12" y1="17" x2="12" y2="3"></line>
                            <path d="M5 17h14v2H5z"></path>
                            <circle cx="12" cy="17" r="1"></circle>
                          </svg>
                        </span>
                      )}
                      {isMuted(conversation) && (
                        <span className="mute-indicator" title="Muted">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="12" 
                            height="12" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                            <line x1="8" y1="23" x2="16" y2="23"></line>
                          </svg>
                        </span>
                      )}
                      <span className="timestamp">
                        {conversation.lastMessage ? 
                          formatDate(conversation.lastMessage.timestamp) : ''}
                      </span>
                    </div>
                  </div>
                  <div className="message-wrapper">
                    <p className="last-message">
                      {conversation.lastMessage ? (
                        <>
                          <span className="sender-name">
                            {conversation.lastMessage.senderId === userId ? 
                              'You: ' : 
                              conversation.lastMessage.senderName ? 
                                `${conversation.lastMessage.senderName.split(' ')[0]}: ` : ''}
                          </span>
                          {conversation.lastMessage.content}
                        </>
                      ) : (
                        <span className="no-messages">No messages yet</span>
                      )}
                    </p>
                    
                    {hasUnreadMessages(conversation) && (
                      <div className="conversation-actions" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => handleMarkAsRead(conversation.id, e)}
                          className="mark-read-btn"
                        >
                          Mark as read
                        </Button>
                        
                        <div className="unread-badge">
                          {conversation.userConversations.find(uc => uc.userId === userId)?.unreadCount || 0}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="conversation-settings" onClick={(e) => e.stopPropagation()}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="settings-btn">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60">
                      <ConversationSettings 
                        conversationId={conversation.id}
                        initialSettings={{
                          muted: isMuted(conversation),
                          pinned: isPinned(conversation)
                        }}
                        onSettingsChanged={(settings) => handleSettingsUpdate(conversation.id, settings)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </Link>
            ) : null
          )}
        </div>
      )}
      
      {renderPagination()}
    </div>
  );
};

export default ConversationList; 