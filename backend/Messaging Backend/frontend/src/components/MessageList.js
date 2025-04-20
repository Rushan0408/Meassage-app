import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getMessages } from '../services/api';
import MessageItem from './MessageItem';
import MarkAllAsRead from './MarkAllAsRead';

const MessageList = ({ conversationId, initialMessages = [], onMessagesLoaded }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(initialMessages.length === 0);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);
  const lastRequestTimeRef = useRef(0);
  const messagesInitializedRef = useRef(false);
  
  // Set initial messages if provided
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
      setLoading(false);
      messagesInitializedRef.current = true;
    }
  }, [initialMessages]);
  
  // Use useCallback to prevent unnecessary re-renders
  const loadMessages = useCallback(async (reset = false) => {
    if (!conversationId) {
      setError('No conversation ID provided');
      setLoading(false);
      return;
    }
    
    // Skip loading if we already have messages from parent and this is initial load
    if (initialMessages && initialMessages.length > 0 && reset && page === 0 && messagesInitializedRef.current) {
      setMessages(initialMessages);
      setLoading(false);
      setPage(1);
      return;
    }
    
    // Implement throttling to prevent too many requests
    const now = Date.now();
    const minInterval = 300; // Reduced from 1000ms to 300ms for faster loading
    
    if (now - lastRequestTimeRef.current < minInterval) {
      console.log('Throttling message request, too soon after previous request');
      return;
    }
    
    lastRequestTimeRef.current = now;
    
    // Smaller page size to reduce resource usage
    const pageSize = 50; // Increased from 30 to load more messages at once
    
    try {
      setLoading(true);
      // Add a delay if we've seen resource errors before
      if (retryCount > 0) {
        // Reduced backoff for faster recovery
        const backoffDelay = Math.min(1000 * Math.pow(1.5, retryCount - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
      
      const response = await getMessages(conversationId, reset ? 0 : page, pageSize);
      
      let newMessages = [];
      
      // Handle different API response formats
      if (response.data && Array.isArray(response.data)) {
        newMessages = response.data;
      } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
        newMessages = response.data.content;
      } else if (response.data) {
        console.warn('Unexpected message API response format:', response.data);
        newMessages = [];
      }
      
      if (reset) {
        setMessages(newMessages);
        // Also notify parent component of loaded messages
        if (onMessagesLoaded) {
          onMessagesLoaded(newMessages);
        }
        setPage(1);
      } else {
        // For older messages (loading more by scrolling up), prepend them
        const combinedMessages = [...newMessages, ...messages];
        // Remove duplicates
        const uniqueMessages = combinedMessages.filter((message, index, self) => 
          index === self.findIndex((m) => m.id === message.id)
        );
        
        // Sort messages by timestamp to ensure proper order
        const sortedMessages = uniqueMessages.sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        setMessages(sortedMessages);
        if (onMessagesLoaded) {
          onMessagesLoaded(sortedMessages);
        }
        setPage(page + 1);
      }
      
      setHasMore(newMessages.length === pageSize);
      setError('');
      setIsPaused(false);
      
      // Reset retry count on success
      setRetryCount(0);
    } catch (error) {
      console.error('Error loading messages:', error);
      
      // Handle different error types
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_INSUFFICIENT_RESOURCES') {
        const errorMsg = error.code === 'ERR_INSUFFICIENT_RESOURCES' ? 
          'The server is busy processing a large conversation. Please try again in a moment.' :
          'Network error: Cannot connect to server. Please check your connection.';
          
        setError(errorMsg);
        setIsPaused(true);
        
        // Only retry automatically on the first error
        if (retryCount < 1) {
          setTimeout(() => {
            setRetryCount(1);
            loadMessages(reset);
          }, 3000);
        }
      } else if (error.response) {
        setError(`Failed to load messages: ${error.response.status} ${error.response.statusText}`);
      } else if (error.request) {
        setError('Failed to load messages: No response from server');
      } else {
        setError(`Failed to load messages: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId, page, retryCount, initialMessages, onMessagesLoaded]);
  
  // Reset and load messages when conversation changes
  useEffect(() => {
    // Force a reload when conversation changes
    setMessages([]);
    setPage(0);
    setHasMore(true);
    setError('');
    setRetryCount(0);
    setIsPaused(false);
    messagesInitializedRef.current = false;
    loadMessages(true);
    
    // Clear any existing intervals or timeouts
    return () => {
      lastRequestTimeRef.current = 0;
    };
  }, [conversationId, loadMessages]);
  
  // Auto-retry on error with exponential backoff
  useEffect(() => {
    let retryTimer;
    
    if (error && retryCount > 0 && retryCount < 4) {
      const backoffDelay = Math.min(2000 * Math.pow(2, retryCount), 15000);
      
      retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        loadMessages(true);
      }, backoffDelay);
    }
    
    return () => clearTimeout(retryTimer);
  }, [error, retryCount, loadMessages]);
  
  // Scroll to bottom when messages load or update
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      scrollToBottom();
    }
  }, [messages, loading]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    
    if (container.scrollTop === 0 && !loading && hasMore && !isPaused) {
      // When user scrolls to top, load older messages
      loadMessages();
    }
    
    // Show scroll button if not at bottom
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollButton(!isAtBottom);
  };
  
  const handleMessageUpdate = (updatedMessage) => {
    setMessages(prev => {
      const updated = prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg);
      // Notify parent component
      if (onMessagesLoaded) {
        onMessagesLoaded(updated);
      }
      return updated;
    });
  };
  
  const handleMessageDelete = (messageId) => {
    setMessages(prev => {
      const updated = prev.filter(msg => msg.id !== messageId);
      // Notify parent component
      if (onMessagesLoaded) {
        onMessagesLoaded(updated);
      }
      return updated;
    });
  };
  
  const handleMessagesMarkedAsRead = () => {
    // Update UI to reflect all messages being read
    setMessages(prev => {
      const updated = prev.map(msg => ({ ...msg, read: true }));
      // Notify parent component
      if (onMessagesLoaded) {
        onMessagesLoaded(updated);
      }
      return updated;
    });
  };
  
  const handleRetry = () => {
    setError('');
    setRetryCount(0);
    setIsPaused(false);
    loadMessages(true);
  };
  
  return (
    <div className="flex flex-col h-full relative">
      {/* Mark all as read button */}
      {messages.some(msg => !msg.read) && (
        <div className="p-2 bg-blue-50">
          <MarkAllAsRead 
            conversationId={conversationId}
            onSuccess={handleMessagesMarkedAsRead}
          />
        </div>
      )}
      
      <div 
        className="flex-1 overflow-y-auto p-4 bg-white flex flex-col gap-3" 
        ref={containerRef}
        onScroll={handleScroll}
      >
        {loading && page === 0 && messages.length === 0 && (
          <div className="py-3 text-center text-gray-500">Loading messages...</div>
        )}
        
        {error && !loading && (
          <div className="p-3 text-center text-red-600 bg-red-50 rounded-md">
            <p className="mb-2">{error}</p>
            <button 
              onClick={handleRetry}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}
        
        {loading && page > 0 && (
          <div className="py-2 text-center text-sm text-gray-500">
            Loading more messages...
          </div>
        )}
        
        {isPaused && !loading && (
          <div className="py-2 text-center text-amber-600 text-sm bg-amber-50 rounded-md">
            Loading paused due to resource constraints. 
            <button 
              onClick={handleRetry}
              className="ml-2 underline"
            >
              Try again
            </button>
          </div>
        )}
        
        {messages.length === 0 && !loading && !error && (
          <div className="py-8 text-center text-gray-500">
            No messages yet. Start the conversation!
          </div>
        )}
        
        <div className="mt-auto flex flex-col space-y-3">
          {messages && messages.length > 0 ? (
            messages.map(message => (
              <MessageItem 
                key={message.id || `temp-${Date.now()}-${Math.random()}`}
                message={message}
                onUpdate={handleMessageUpdate}
                onDelete={handleMessageDelete}
              />
            ))
          ) : null}
          <div ref={messagesEndRef}></div>
        </div>
      </div>
      
      {showScrollButton && (
        <button 
          className="absolute bottom-4 right-4 bg-gray-800 text-white rounded-full p-2 shadow-lg"
          onClick={scrollToBottom}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
};

export default MessageList; 