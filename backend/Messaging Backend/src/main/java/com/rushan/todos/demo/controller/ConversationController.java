package com.rushan.todos.demo.controller;

import com.rushan.todos.demo.entity.Conversation;
import com.rushan.todos.demo.service.ConversationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    @Autowired
    private ConversationService conversationService;

    @PostMapping
    public Conversation createConversation(@RequestBody Conversation conversation) {
        return conversationService.createConversation(conversation);
    }

    @GetMapping
    public List<Conversation> getUserConversations(@RequestParam String userId) {
        return conversationService.getUserConversations(userId);
    }

    @GetMapping("/{id}")
    public Conversation getConversationById(@PathVariable String id) {
        return conversationService.getConversationById(id);
    }

    @PutMapping("/{id}")
    public Conversation updateConversation(@PathVariable String id, @RequestBody Conversation updatedConversation) {
        return conversationService.updateConversation(id, updatedConversation);
    }

    @DeleteMapping("/{id}")
    public String deleteConversation(@PathVariable String id) {
        conversationService.deleteConversation(id);
        return "Conversation deleted successfully.";
    }
}