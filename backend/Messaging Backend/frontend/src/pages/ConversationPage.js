import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getConversationById, markConversationAsRead } from '../services/api';
import { getAuthData } from '../utils/auth';
import ConversationHeader from '../components/ConversationHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { subscribeToConversation, sendTypingStatus } from '../services/websocket';
import './ConversationPage.css';

const ConversationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const { userId } = getAuthData();
  const typingTimeoutRef = useRef(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!id || !userId) {
          setError('Invalid parameters');
          setLoading(false);
          return;
        }
        
        // Special case for 'new' - redirect to create conversation page
        if (id === 'new') {
          navigate('/conversations/create');
          return;
        }
        
        const response = await getConversationById(id);
        setConversation(response.data);
        
        // Mark conversation as read when viewing
        try {
          console.log('Attempting to mark conversation as read:', {
            conversationId: id,
            userId: userId,
            userIdType: typeof userId
          });
          
          await markConversationAsRead(id, userId);
          console.log('Successfully marked conversation as read');
        } catch (markReadError) {
          // Log the error but don't fail the entire operation
          console.warn('Failed to mark conversation as read:', markReadError);
          
          if (markReadError.response) {
            console.warn('Error response data:', markReadError.response.data);
          }
          
          // Try again with a slight delay as a fallback
          setTimeout(async () => {
            try {
              await markConversationAsRead(id, typeof userId === 'string' ? userId : userId?.userId);
              console.log('Successfully marked conversation as read on second attempt');
            } catch (retryError) {
              console.warn('Failed to mark conversation as read on retry:', retryError);
            }
          }, 1500);
        }
        
      } catch (err) {
        console.error('Error fetching conversation:', err);
        
        // Check if response is available
        if (err.response) {
          // Handle specific status codes
          if (err.response.status === 404) {
            setError('Conversation not found. It may have been deleted or you might not have access to it.');
          } else if (err.response.status === 500) {
            setError('Server error. Please try again later.');
          } else {
            setError(`Failed to load conversation: ${err.response?.data?.message || 'Unknown error'}`);
          }
        } else if (err.request) {
          // Request was made but no response
          setError('Network error. Please check your connection.');
        } else {
          // Something else happened
          setError('Failed to load conversation. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [id, userId, navigate]);

  // Set up WebSocket subscription for real-time updates
  useEffect(() => {
    if (!id || !userId) return;

    // WebSocket message handler
    const handleWebSocketMessage = (message) => {
      console.log('WebSocket message received:', message);
      
      if (message.type === 'MESSAGE') {
        // New message received - update conversation
        getConversationById(id)
          .then(response => setConversation(response.data))
          .catch(error => console.error('Failed to update conversation:', error));
      } 
      else if (message.type === 'TYPING') {
        // Typing indicator
        if (message.userId !== userId) {
          if (message.isTyping) {
            // Add user to typing users
            setTypingUsers(prev => [...prev.filter(u => u !== message.userId), message.userId]);
          } else {
            // Remove user from typing users
            setTypingUsers(prev => prev.filter(u => u !== message.userId));
          }
        }
      }
      else if (message.type === 'CONVERSATION_UPDATE') {
        // Conversation was updated (settings changed, etc.)
        getConversationById(id)
          .then(response => setConversation(response.data))
          .catch(error => console.error('Failed to update conversation:', error));
      }
    };

    // Subscribe to conversation updates
    subscriptionRef.current = subscribeToConversation(id, handleWebSocketMessage);

    // Clean up subscription
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      
      // Clear typing indicator when leaving
      sendTypingStatus(id, false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [id, userId]);

  const handleMessageSent = () => {
    // Stop typing indicator
    sendTypingStatus(id, false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    // Refresh conversation to show latest messages
    getConversationById(id)
      .then(response => setConversation(response.data))
      .catch(error => console.error('Failed to update conversation:', error));
  };

  const handleTyping = () => {
    // Send typing indicator
    sendTypingStatus(id, true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to clear typing status after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(id, false);
    }, 3000);
  };

  if (loading) {
    return <div className="loading-container">Loading conversation...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!conversation) {
    return <div className="not-found-container">Conversation not found</div>;
  }

  // Get names of typing users
  const getTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    const typingUserNames = typingUsers.map(typingUserId => {
      const participant = conversation.participants.find(p => p.id === typingUserId);
      return participant ? participant.firstName : 'Someone';
    });

    if (typingUserNames.length === 1) {
      return `${typingUserNames[0]} is typing...`;
    } else if (typingUserNames.length === 2) {
      return `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`;
    } else {
      return 'Several people are typing...';
    }
  };

  return (
    <div className="conversation-page">
      <ConversationHeader conversation={conversation} />
      <MessageList conversationId={id} />
      
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {getTypingIndicator()}
        </div>
      )}
      
      <MessageInput 
        conversationId={id} 
        onMessageSent={handleMessageSent}
        onTyping={handleTyping}
      />
    </div>
  );
};

export default ConversationPage; 