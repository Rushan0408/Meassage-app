package com.rushan.todos.demo.controller;

import com.rushan.todos.demo.dto.MessageDto;
import com.rushan.todos.demo.dto.PaginatedResponse;
import com.rushan.todos.demo.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", 
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<PaginatedResponse<MessageDto>> getMessages(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long before) {
        
        Date beforeDate = before != null ? new Date(before) : null;
        return ResponseEntity.ok(messageService.getMessages(conversationId, page, size, beforeDate));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageDto> sendMessage(
            @PathVariable String conversationId,
            @RequestBody MessageDto messageDto) {
        
        return ResponseEntity.ok(messageService.sendMessage(conversationId, messageDto));
    }

    @PutMapping("/messages/{id}")
    public ResponseEntity<MessageDto> editMessage(
            @PathVariable String id,
            @RequestBody Map<String, String> updates) {
        
        return ResponseEntity.ok(messageService.editMessage(id, updates.get("content")));
    }

    @DeleteMapping("/messages/{id}")
    public ResponseEntity<Map<String, String>> deleteMessage(@PathVariable String id) {
        messageService.deleteMessage(id);
        return ResponseEntity.ok(Map.of("message", "Message deleted successfully"));
    }

    @PutMapping("/messages/{id}/read")
    public ResponseEntity<MessageDto> markMessageAsRead(@PathVariable String id) {
        return ResponseEntity.ok(messageService.markAsRead(id));
    }

    @PutMapping("/messages/mark-all-read/{conversationId}")
    public ResponseEntity<List<MessageDto>> markAllMessagesAsRead(
            @PathVariable String conversationId,
            @RequestParam String userId,
            @RequestBody(required = false) Map<String, Object> request) {
        
        // Get userId from either request body or request parameter
        String userIdToUse = userId;
        
        // If userId is provided in the request body and not as a parameter, use that
        if ((userIdToUse == null || userIdToUse.isEmpty()) && request != null) {
            Object userIdObj = request.get("userId");
            if (userIdObj instanceof String) {
                userIdToUse = (String) userIdObj;
            } else if (userIdObj != null) {
                userIdToUse = String.valueOf(userIdObj);
            }
        }
        
        if (userIdToUse == null || userIdToUse.isEmpty()) {
            throw new IllegalArgumentException("userId is required");
        }
        
        return ResponseEntity.ok(messageService.markAllMessagesAsReadInConversation(conversationId, userIdToUse));
    }
}