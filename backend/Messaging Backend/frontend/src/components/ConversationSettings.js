import React, { useState, useEffect } from 'react';
import { updateUserConversationSettings } from '../services/api';
import { getAuthData } from '../utils/auth';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

const ConversationSettings = ({ conversationId, initialSettings = {}, onSettingsChanged }) => {
  const [settings, setSettings] = useState({
    muted: initialSettings.muted || false,
    pinned: initialSettings.pinned || false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { userId } = getAuthData();

  useEffect(() => {
    setSettings({
      muted: initialSettings.muted || false,
      pinned: initialSettings.pinned || false
    });
  }, [initialSettings]);

  const handleToggleSetting = async (setting) => {
    try {
      setIsLoading(true);
      
      const updatedSettings = {
        ...settings,
        [setting]: !settings[setting],
        userId
      };
      
      // Update settings in the backend
      const response = await updateUserConversationSettings(conversationId, updatedSettings);
      
      // Update local state
      setSettings({
        muted: response.data.muted,
        pinned: response.data.pinned
      });
      
      // Notify parent component
      if (onSettingsChanged) {
        onSettingsChanged(response.data);
      }
    } catch (error) {
      console.error('Failed to update conversation settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="muted">Mute Conversation</Label>
          <p className="text-sm text-muted-foreground">
            Don't receive notifications for this conversation
          </p>
        </div>
        <Switch
          id="muted"
          checked={settings.muted}
          onCheckedChange={() => handleToggleSetting('muted')}
          disabled={isLoading}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="pinned">Pin Conversation</Label>
          <p className="text-sm text-muted-foreground">
            Keep this conversation at the top of your list
          </p>
        </div>
        <Switch
          id="pinned"
          checked={settings.pinned}
          onCheckedChange={() => handleToggleSetting('pinned')}
          disabled={isLoading}
        />
      </div>
      
      <Button 
        variant="destructive"
        size="sm"
        className="w-full mt-4"
        onClick={() => {
          // For now, this is just a placeholder
          // You would typically implement conversation leaving/deletion here
          if (onSettingsChanged) {
            onSettingsChanged({ action: 'leave' });
          }
        }}
      >
        Leave Conversation
      </Button>
    </div>
  );
};

export default ConversationSettings; 