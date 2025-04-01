package com.rushan.todos.demo.controller;

import com.rushan.todos.demo.websocket.WebSocketMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WebSocketController {

    @Autowired
    private WebSocketMessageService webSocketMessageService;

    @MessageMapping("/conversations/{conversationId}/typing")
    @SendTo("/topic/conversations/{conversationId}")
    public String handleTypingIndicator(String typingStatus) {
        return typingStatus;
    }

    @MessageMapping("/notifications")
    @SendToUser("/queue/notifications")
    public String handleNotification(String notification) {
        return notification;
    }
}