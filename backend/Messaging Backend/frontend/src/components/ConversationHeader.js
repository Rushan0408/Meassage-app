import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';
import { getAuthData } from '../utils/auth';
import ConversationSettings from './ConversationSettings';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

const ConversationHeader = ({ conversation, typingIndicator, onSettingsChanged }) => {
  const navigate = useNavigate();
  const { userId } = getAuthData();
  
  // Find user-specific settings for this conversation
  const userConversation = conversation.userConversations?.find(uc => uc.userId === userId) || {};

  const goBack = () => {
    navigate('/conversations');
  };

  if (!conversation) return null;

  // Find other participants (excluding current user)
  const otherParticipants = conversation.participants?.filter(p => p.id !== userId) || [];

  // Get conversation title - either the group name or the name of the other participant
  const getConversationTitle = () => {
    if (conversation.type === 'GROUP') {
      return conversation.title || 'Group Chat';
    }
    
    // For direct messages, use the other person's name
    if (otherParticipants.length > 0) {
      const otherUser = otherParticipants[0];
      return `${otherUser.firstName} ${otherUser.lastName || ''}`.trim();
    }
    
    return 'Conversation';
  };

  // Get avatar for header
  const getHeaderAvatar = () => {
    if (conversation.type === 'GROUP') {
      // Group avatar (could be customized further)
      return (
        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
          <span className="text-sm font-medium">
            {conversation.title ? conversation.title.substring(0, 2).toUpperCase() : 'GC'}
          </span>
        </div>
      );
    }
    
    // For direct messages, show the other person's avatar
    if (otherParticipants.length > 0) {
      const otherUser = otherParticipants[0];
      
      if (otherUser.profilePicture) {
        return (
          <Avatar src={otherUser.profilePicture} alt={otherUser.firstName} className="h-10 w-10" />
        );
      }
      
      return (
        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
          <span className="text-sm font-medium">
            {otherUser.firstName.substring(0, 1).toUpperCase()}
            {otherUser.lastName ? otherUser.lastName.substring(0, 1).toUpperCase() : ''}
          </span>
        </div>
      );
    }
    
    // Fallback avatar
    return (
      <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center text-white">
        <span className="text-sm font-medium">?</span>
      </div>
    );
  };
  
  // Handle settings changes
  const handleSettingsChange = (updatedSettings) => {
    if (onSettingsChanged) {
      onSettingsChanged(updatedSettings);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border-b bg-white">
      <div className="flex items-center space-x-3">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={goBack}
          className="md:hidden"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Button>
        
        {getHeaderAvatar()}
        
        <div>
          <h2 className="font-semibold">{getConversationTitle()}</h2>
          {typingIndicator ? (
            <p className="text-sm text-blue-500 italic">{typingIndicator}</p>
          ) : (
            conversation.participants && (
              <p className="text-sm text-gray-500">
                {conversation.type === 'GROUP' 
                  ? `${conversation.participants.length} members` 
                  : otherParticipants[0]?.status === 'ONLINE'
                    ? 'Online'
                    : 'Offline'
                }
              </p>
            )
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => {/* Open voice/video call */}}
          className="hidden md:flex"
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
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {/* Open settings */}}
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
                <circle cx="12" cy="12" r="1"/>
                <circle cx="19" cy="12" r="1"/>
                <circle cx="5" cy="12" r="1"/>
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