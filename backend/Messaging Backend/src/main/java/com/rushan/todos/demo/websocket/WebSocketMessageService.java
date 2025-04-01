package com.rushan.todos.demo.websocket;


import com.rushan.todos.demo.entity.Message;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketMessageService {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketMessageService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendMessageUpdate(String conversationId, Message message) {
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, message);
    }

    public void sendNotificationUpdate(String userId, String notification) {
        messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", notification);
    }
}