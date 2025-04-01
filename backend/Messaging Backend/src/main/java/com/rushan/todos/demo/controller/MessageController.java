package com.rushan.todos.demo.controller;

import com.rushan.todos.demo.entity.Message;
import com.rushan.todos.demo.service.MessageService;
import com.rushan.todos.demo.websocket.WebSocketMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations/{conversationId}/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private WebSocketMessageService webSocketMessageService;

    @PostMapping
    public Message sendMessage(@PathVariable String conversationId, @RequestBody Message message) {
        message.setConversationId(conversationId);
        Message savedMessage = messageService.sendMessage(message);

        // Send real-time update
        webSocketMessageService.sendMessageUpdate(conversationId, savedMessage);
        return savedMessage;
    }

    @GetMapping
    public List<Message> getMessages(@PathVariable String conversationId) {
        return messageService.getMessagesByConversation(conversationId);
    }
}