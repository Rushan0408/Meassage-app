import React, { useState } from 'react';
import { markConversationAsRead } from '../services/api';
import { getAuthData } from '../utils/auth';
import { Button } from './ui/button';

const MarkAllAsRead = ({ conversationId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { userId } = getAuthData();

  const handleMarkAllAsRead = async () => {
    if (!conversationId || !userId) {
      console.warn('Missing required parameters', { conversationId, userId });
      return;
    }
    
    setError(false);
    
    try {
      setLoading(true);
      console.log('Marking all as read with params:', {
        conversationId, 
        userId: typeof userId === 'object' ? userId.userId : userId
      });
      
      // Just pass userId as string instead of object to avoid issues
      await markConversationAsRead(conversationId, typeof userId === 'string' ? userId : userId?.userId);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
      if (error.response) {
        console.error('Error details:', error.response.data);
      }
      setError(true);
      
      // Try one more time with a delay
      setTimeout(async () => {
        try {
          await markConversationAsRead(conversationId, typeof userId === 'string' ? userId : userId?.userId);
          setError(false);
          if (onSuccess) {
            onSuccess();
          }
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${error ? 'space-y-2' : ''}`}>
      <Button
        variant={error ? "destructive" : "outline"}
        size="sm"
        disabled={loading}
        onClick={handleMarkAllAsRead}
        className="w-full"
      >
        {loading ? 'Marking...' : error ? 'Retry Mark All as Read' : 'Mark All as Read'}
      </Button>
      
      {error && (
        <div className="text-xs text-destructive text-center">
          Failed to mark messages as read. Click to retry.
        </div>
      )}
    </div>
  );
};

export default MarkAllAsRead; 