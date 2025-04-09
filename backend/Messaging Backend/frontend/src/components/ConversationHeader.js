import React, { useState } from 'react';
import { getAuthData } from '../utils/auth';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';
import ConversationSettings from './ConversationSettings';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

const ConversationHeader = ({ conversation, onSettingsChanged }) => {
  const { userId } = getAuthData();
  
  // Find user-specific settings for this conversation
  const userConversation = conversation.userConversations?.find(uc => uc.userId === userId) || {};

  // Determine display name (group name or participant's name)
  const displayName = conversation.type === 'group' 
    ? conversation.name 
    : conversation.participants.find(p => p.id !== userId)?.firstName + ' ' + 
      conversation.participants.find(p => p.id !== userId)?.lastName;
  
  // Determine online status (for direct messages only)
  const isOnline = conversation.type === 'direct' && 
    conversation.participants.find(p => p.id !== userId)?.status === 'online';
  
  // Get the first letter of the other participant's name for the avatar
  const avatarFallback = conversation.type === 'group'
    ? (conversation.name?.charAt(0) || 'G')
    : conversation.participants.find(p => p.id !== userId)?.firstName?.charAt(0) || '?';

  // Handle settings changes
  const handleSettingsChange = (updatedSettings) => {
    if (onSettingsChanged) {
      onSettingsChanged(updatedSettings);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shadow-sm">
      <div className="flex items-center">
        <Avatar 
          size="lg"
          fallback={avatarFallback}
          className={isOnline ? "ring-2 ring-green-500 ring-offset-2" : ""}
        />
        
        <div className="ml-3">
          <h3 className="text-lg font-semibold">{displayName}</h3>
          
          {conversation.type === 'direct' ? (
            <p className="text-sm text-muted-foreground">
              {isOnline ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                  Online
                </span>
              ) : 'Offline'}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {conversation.participants.length} members
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="icon"
          aria-label="Call"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-5 h-5"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              aria-label="Settings"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-5 h-5"
              >
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
                <circle cx="5" cy="12" r="1.5" />
              </svg>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <ConversationSettings 
              conversationId={conversation.id}
              initialSettings={{
                muted: userConversation.muted || false,
                pinned: userConversation.pinned || false
              }}
              onSettingsChanged={handleSettingsChange}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ConversationHeader; 