package com.rushan.todos.demo.websocket;

import com.rushan.todos.demo.dto.MessageDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class WebSocketMessageService {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    public void sendMessageUpdate(String conversationId, MessageDto message) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "MESSAGE");
        response.put("message", message);
        
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, response);
    }
    
    public void sendMessageDeleted(String conversationId, String messageId) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "DELETE");
        response.put("messageId", messageId);
        
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, response);
    }
    
    public void sendTypingStatus(String conversationId, String userId, boolean isTyping) {
        Map<String, Object> status = new HashMap<>();
        status.put("type", "TYPING");
        status.put("userId", userId);
        status.put("isTyping", isTyping);
        
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, status);
    }
    
    public void sendConversationUpdate(String conversationId) {
        Map<String, Object> update = new HashMap<>();
        update.put("type", "CONVERSATION_UPDATE");
        
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, update);
    }
    
    public void sendNotification(String userId, String content, String type) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", type);
        notification.put("content", content);
        notification.put("timestamp", System.currentTimeMillis());
        
        messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", notification);
    }
    
    public void sendGroupMessage(List<String> userIds, String content, String type) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", type);
        message.put("content", content);
        message.put("timestamp", System.currentTimeMillis());
        
        for (String userId : userIds) {
            messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", message);
        }
    }
    
    public void sendReadReceipt(String conversationId, String messageId, String userId) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "READ_RECEIPT");
        response.put("messageId", messageId);
        response.put("userId", userId);
        response.put("timestamp", new Date());

        // Send to the specific user who is the message sender
        messagingTemplate.convertAndSend("/topic/user/" + userId, response);
        
        // Also broadcast to the conversation so all participants are aware
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, response);
    }

    // Add a new method for broadcasting when multiple messages are marked as read
    public void sendBulkReadReceipt(String conversationId, List<String> messageIds, String userId) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "BULK_READ_RECEIPT");
        response.put("messageIds", messageIds);
        response.put("userId", userId);
        response.put("conversationId", conversationId);
        response.put("timestamp", new Date());

        // Broadcast to the conversation topic
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, response);
    }
}