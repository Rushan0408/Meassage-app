import React, { useState } from 'react';
import { formatDate } from '../utils/formatDate';
import { editMessage, deleteMessage } from '../services/api';
import { getAuthData } from '../utils/auth';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const MessageItem = ({ message, onMessageUpdate, onMessageDelete }) => {
  // Ensure message is an object to prevent errors
  const safeMessage = message || {};
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(safeMessage.content || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const { userId } = getAuthData();
  const isOwner = userId === safeMessage.senderId;
  
  const handleEditClick = () => {
    setIsEditing(true);
    setEditedText(safeMessage.content || '');
    setError('');
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setError('');
  };
  
  const handleSaveEdit = async () => {
    if (!editedText.trim()) {
      setError('Message cannot be empty');
      return;
    }
    
    try {
      setError('');
      const updatedMessage = await editMessage(safeMessage.id, { content: editedText });
      onMessageUpdate(updatedMessage.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update message:', error);
      
      if (error.code === 'ERR_NETWORK') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to update message. Please try again.');
      }
    }
  };
  
  const handleRetryEdit = async () => {
    try {
      setError('Retrying...');
      const updatedMessage = await editMessage(safeMessage.id, { content: editedText });
      onMessageUpdate(updatedMessage.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update message (retry):', error);
      setError('Failed to update message. Please try again later.');
    }
  };
  
  const handleDeleteClick = () => {
    setIsDeleting(true);
    setError('');
  };
  
  const handleConfirmDelete = async () => {
    try {
      setError('');
      await deleteMessage(safeMessage.id);
      onMessageDelete(safeMessage.id);
    } catch (error) {
      console.error('Failed to delete message:', error);
      
      if (error.code === 'ERR_NETWORK') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to delete message. Please try again.');
      }
      setIsDeleting(false);
    }
  };
  
  const handleRetryDelete = async () => {
    try {
      setError('Retrying...');
      await deleteMessage(safeMessage.id);
      onMessageDelete(safeMessage.id);
    } catch (error) {
      console.error('Failed to delete message (retry):', error);
      setError('Failed to delete message. Please try again later.');
    }
  };
  
  const handleCancelDelete = () => {
    setIsDeleting(false);
    setError('');
  };
  
  // If message is invalid, don't render anything
  if (!safeMessage || !safeMessage.id) {
    return null;
  }
  
  return (
    <div className={`py-3 border-b border-border ${isOwner ? 'ml-auto' : 'mr-auto'} max-w-[80%] mb-2`}>
      <div className="flex items-start gap-2">
        <div className={`flex flex-col ${isOwner ? 'items-end' : 'items-start'} w-full`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{safeMessage.senderName || 'Unknown User'}</span>
            <span className="text-xs text-muted-foreground">
              {safeMessage.timestamp ? formatDate(safeMessage.timestamp) : 'Unknown time'}
            </span>
            
            {isOwner && !isEditing && !isDeleting && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditClick}>Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {error && (
            <div className="text-sm text-red-500 mb-2 p-2 bg-red-50 rounded-md w-full">
              {error}
              {error.includes('Network error') && (
                <button 
                  className="ml-2 text-blue-500 underline text-xs"
                  onClick={isEditing ? handleRetryEdit : handleRetryDelete}
                >
                  Retry
                </button>
              )}
            </div>
          )}
          
          {!isEditing && !isDeleting && (
            <div className="text-sm">{safeMessage.content || 'No content'}</div>
          )}
          
          {isEditing && (
            <div className="w-full">
              <textarea 
                className="w-full p-2 border border-input rounded-md mb-2 text-sm min-h-[80px]"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
              </div>
            </div>
          )}
          
          {isDeleting && (
            <div className="p-2 bg-destructive/10 rounded-md mb-2">
              <p className="text-sm mb-2">Are you sure you want to delete this message?</p>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={handleCancelDelete}>
                  Cancel
                </Button>
                <Button size="sm" variant="destructive" onClick={handleConfirmDelete}>
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem; 