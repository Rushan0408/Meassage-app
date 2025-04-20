import React, { useState } from 'react';
import { markAllMessagesAsRead } from '../services/api';
import { getAuthData } from '../utils/auth';
import { Button } from './ui/button';
import { showToast } from './ui/ToastPortal';

const MarkAllAsRead = ({ conversationId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { userId } = getAuthData();

  const handleMarkAllAsRead = async () => {
    if (!conversationId || !userId) {
      showToast('Unable to mark messages as read: Missing parameters', 'error');
      return;
    }

    try {
      setLoading(true);
      setError(false);
      
      await markAllMessagesAsRead(conversationId, userId);
      
      // Call success callback to update UI state
      if (onSuccess) {
        onSuccess();
      }
      
      showToast('All messages marked as read', 'success');
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
      setError(true);
      
      // More detailed error message based on error type
      let errorMsg = 'Failed to mark messages as read';
      if (err.response) {
        if (err.response.status === 400) {
          errorMsg += ': Invalid request format';
        } else if (err.response.status === 401) {
          errorMsg += ': Authentication required';
        } else if (err.response.status === 403) {
          errorMsg += ': Not authorized';
        } else if (err.response.status === 404) {
          errorMsg += ': Conversation not found';
        } else if (err.response.status >= 500) {
          errorMsg += ': Server error';
        }
      } else if (err.request) {
        errorMsg += ': Network error';
      }
      
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    handleMarkAllAsRead();
  };

  if (error) {
    return (
      <div className="flex items-center justify-between bg-red-50 p-2 rounded text-sm">
        <span className="text-red-600">Failed to mark messages as read. Click to retry.</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRetry}
          disabled={loading}
          className="text-xs py-1 px-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleMarkAllAsRead}
        disabled={loading}
        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
      >
        {loading ? 'Marking as read...' : 'Mark all as read'}
      </Button>
    </div>
  );
};

export default MarkAllAsRead; 