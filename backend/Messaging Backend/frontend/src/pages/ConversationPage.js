import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getConversationById, markConversationAsRead, getMessages } from '../services/api';
import api from '../services/api';
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
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const { userId } = getAuthData();
  const typingTimeoutRef = useRef(null);
  const subscriptionRef = useRef(null);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (!id || !userId) {
      setLoading(false);
      return;
    }
    
    // Don't attempt to load a conversation if id is just 'new'
    if (id === 'new') {
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get conversation details
        const convoResponse = await getConversationById(id);
        const convoData = convoResponse.data;
        
        setConversation(convoData);
        
        // Load initial messages with a larger page size for better initial view
        const msgResponse = await getMessages(id, 0, 75);
        
        // Ensure proper handling of different API response formats
        let msgData = [];
        if (msgResponse.data && Array.isArray(msgResponse.data)) {
          msgData = msgResponse.data;
        } else if (msgResponse.data && msgResponse.data.content && Array.isArray(msgResponse.data.content)) {
          msgData = msgResponse.data.content;
        } else if (msgResponse.data) {
          console.warn('Unexpected message response format:', msgResponse.data);
        }
        
        setMessages(msgData);
        
        // Mark conversation as read with better error handling
        try {
          await markConversationAsRead(id, userId);
        } catch (readError) {
          console.error('Failed to mark conversation as read:', readError);
          
          // Try alternative approach if first method fails
          if (readError.response && readError.response.status === 400) {
            // Wait a moment and try again with a different approach
            setTimeout(async () => {
              try {
                // Try sending as direct JSON string if structured object failed
                const response = await api.put(`/user-conversations/${id}/read`, 
                  JSON.stringify({ userId }), 
                  { headers: { 'Content-Type': 'application/json' } }
                );
                console.log('Marked conversation as read with alternative method');
              } catch (retryError) {
                console.error('Second attempt to mark conversation as read failed:', retryError);
              }
            }, 500);
          }
        }
        
        initialLoadDoneRef.current = true;
      } catch (error) {
        console.error('Error loading conversation data:', error);
        
        if (error.response && error.response.status === 404) {
          setError('Conversation not found');
        } else {
          setError('Failed to load conversation data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, userId]);

  // Set up WebSocket subscription for real-time updates
  useEffect(() => {
    if (!id || !userId) return;

    // WebSocket message handler - directly update UI without unnecessary API calls
    const handleWebSocketMessage = (message) => {
      if (message.type === 'MESSAGE') {
        // Directly add the new message to the messages state
        const newMessage = message.message;
        setMessages(prevMessages => {
          // Check if message already exists to prevent duplicates
          if (prevMessages.some(msg => msg.id === newMessage.id)) {
            return prevMessages.map(msg => 
              msg.id === newMessage.id ? newMessage : msg
            );
          }
          // Add new message and sort by timestamp
          return [...prevMessages, newMessage].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
          );
        });
        
        // Update conversation metadata
        setConversation(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            lastMessage: newMessage,
            lastActivity: newMessage.timestamp
          };
        });
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
      else if (message.type === 'DELETE') {
        // Remove deleted message
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== message.messageId)
        );
      }
      else if (message.type === 'CONVERSATION_UPDATE') {
        // Only fetch conversation data for metadata updates
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

  const handleMessageSent = (newMessage) => {
    // Stop typing indicator
    sendTypingStatus(id, false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    // Directly update messages in state instead of refetching
    if (newMessage) {
      setMessages(prevMessages => {
        // Check if message already exists
        if (prevMessages.some(msg => msg.id === newMessage.id)) {
          return prevMessages.map(msg => 
            msg.id === newMessage.id ? newMessage : msg
          );
        }
        return [...prevMessages, newMessage].sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
      });
      
      // Update conversation metadata
      setConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          lastMessage: newMessage,
          lastActivity: newMessage.timestamp
        };
      });
    }
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
      return `${typingUserNames.length} people are typing...`;
    }
  };

  return (
    <div className="conversation-container">
      <ConversationHeader 
        conversation={conversation} 
        typingIndicator={getTypingIndicator()} 
      />
      
      <MessageList 
        conversationId={id} 
        initialMessages={messages}
        onMessagesLoaded={setMessages}
      />
      
      <MessageInput 
        conversationId={id} 
        onMessageSent={handleMessageSent} 
        onTyping={handleTyping}
      />
    </div>
  );
};

export default ConversationPage; 