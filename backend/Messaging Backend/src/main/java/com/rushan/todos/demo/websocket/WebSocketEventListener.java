package com.rushan.todos.demo.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.stereotype.Component;

@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    private final SimpMessageSendingOperations messagingTemplate;

    public WebSocketEventListener(SimpMessageSendingOperations messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        logger.info("New WebSocket Connection Established");
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        logger.info("WebSocket Disconnected");
    }
}