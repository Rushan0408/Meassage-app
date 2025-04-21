package com.rushan.todos.demo.controller;

import com.rushan.todos.demo.dto.BulkReadReceiptRequest;
import com.rushan.todos.demo.dto.ReadReceiptRequest;
import com.rushan.todos.demo.websocket.WebSocketMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class WebSocketController {

    @Autowired
    private WebSocketMessageService webSocketMessageService;

    @MessageMapping("/conversations/{conversationId}/typing")
    @SendTo("/topic/conversations/{conversationId}")
    public String handleTypingIndicator(@Payload com.rushan.todos.demo.dto.TypingIndicatorRequest typingRequest) {
        return typingRequest.getStatus();
    }

    @MessageMapping("/conversations/{conversationId}/read")
    public void handleReadReceipt(
            @DestinationVariable String conversationId,
            @Payload Map<String, Object> payload) {
        String messageId = (String) payload.get("messageId");
        String userId = (String) payload.get("userId");
        
        webSocketMessageService.sendReadReceipt(conversationId, messageId, userId);
    }

    @MessageMapping("/notifications")
    @SendToUser("/queue/notifications")
    public String handleNotification(@Payload com.rushan.todos.demo.dto.NotificationRequest notification) {
        return notification.getMessage();
    }

    @MessageMapping("/chat/{conversationId}/read")
    public void handleReadReceipt(
            @DestinationVariable String conversationId,
            @Payload ReadReceiptRequest request) {
        String messageId = request.getMessageId();
        String userId = request.getUserId();
        
        webSocketMessageService.sendReadReceipt(conversationId, messageId, userId);
    }
    
    @MessageMapping("/chat/{conversationId}/read-bulk")
    public void handleBulkReadReceipt(
            @DestinationVariable String conversationId,
            @Payload BulkReadReceiptRequest request) {
        List<String> messageIds = request.getMessageIds();
        String userId = request.getUserId();
        
        webSocketMessageService.sendBulkReadReceipt(conversationId, messageIds, userId);
    }
}