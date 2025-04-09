import React, { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../services/api';
import { getAuthData } from '../utils/auth';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { isWebSocketConnected, forceReconnect } from '../services/websocket';
import { showToast } from './ui/ToastPortal';

const MessageInput = ({ conversationId, onMessageSent, onTyping }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { userId } = getAuthData();

  // Clear typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && attachments.length === 0) return;
    
    try {
      setIsSending(true);
      
      // Check WebSocket connectivity
      if (!isWebSocketConnected()) {
        console.log("WebSocket not connected. Attempting to reconnect...");
        forceReconnect();
        showToast("Reconnecting to the server...", "warning");
        
        // Give some time to reconnect
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!isWebSocketConnected()) {
          showToast("Could not connect to the server. Your message will be sent but real-time updates may be delayed.", "warning");
        }
      }
      
      const messageData = {
        senderId: userId,
        content: message.trim(),
        attachments: attachments
      };
      
      console.log("Sending message:", messageData);
      const response = await sendMessage(conversationId, messageData);
      console.log("Message sent successfully:", response.data);
      
      // Clear form
      setMessage('');
      setAttachments([]);
      
      // Notify parent component
      if (onMessageSent) {
        onMessageSent(response.data);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      showToast("Failed to send message. Please try again.", "error");
    } finally {
      setIsSending(false);
    }
  };
  
  const handleMessageChange = (e) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    // Trigger typing indicator
    if (onTyping && newMessage.trim()) {
      onTyping();
    }
  };
  
  const handleAttachmentClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // For simplicity, we're just storing the file names here
    // In a real app, you would upload these to a server and get URLs back
    setAttachments(prevAttachments => [
      ...prevAttachments,
      ...files.map(file => file.name)
    ]);
    
    // Clear the file input
    e.target.value = '';
  };
  
  const removeAttachment = (index) => {
    setAttachments(prevAttachments => 
      prevAttachments.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="p-4 border-t border-gray-100 bg-white">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((attachment, index) => (
            <div key={index} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
              <span className="max-w-[150px] truncate">{attachment}</span>
              <button 
                type="button" 
                className="ml-1.5 text-blue-500 hover:text-blue-700 focus:outline-none"
                onClick={() => removeAttachment(index)}
              >
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
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <Button 
          type="button" 
          variant="ghost"
          size="icon"
          onClick={handleAttachmentClick}
          className="flex-shrink-0"
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
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
          </svg>
        </Button>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
          multiple
        />
        
        <Input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={handleMessageChange}
          className="rounded-full bg-gray-50"
        />
        
        <Button 
          type="submit" 
          variant="primary"
          size="icon"
          disabled={(!message.trim() && attachments.length === 0) || isSending}
          className="flex-shrink-0 rounded-full"
        >
          {isSending ? (
            <svg 
              className="animate-spin" 
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
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
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
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </Button>
      </form>
    </div>
  );
};

export default MessageInput; 