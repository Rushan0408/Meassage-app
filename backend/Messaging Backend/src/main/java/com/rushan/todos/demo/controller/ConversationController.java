package com.rushan.todos.demo.controller;

import com.rushan.todos.demo.dto.ConversationRequest;
import com.rushan.todos.demo.dto.ConversationResponse;
import com.rushan.todos.demo.dto.PaginatedResponse;
import com.rushan.todos.demo.entity.Conversation;
import com.rushan.todos.demo.exception.ConversationNotFoundException;
import com.rushan.todos.demo.service.ConversationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    @Autowired
    private ConversationService conversationService;

    @PostMapping
    public ResponseEntity<ConversationResponse> createConversation(@RequestBody ConversationRequest request) {
        return ResponseEntity.ok(conversationService.createConversation(request));
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<ConversationResponse>> getUserConversations(
            @RequestParam(required = true) String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        PaginatedResponse<ConversationResponse> conversations = 
            conversationService.getUserConversationsWithDetails(userId, page, size);
        
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getConversationById(@PathVariable String id) {
        try {
            // Special case for 'new' which is sometimes used in routes but isn't a valid ID
            if ("new".equals(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No conversation found with id: " + id, 
                                "message", "Creating a new conversation requires a POST request"));
            }
            
            ConversationResponse conversation = conversationService.getConversationByIdWithDetails(id);
            return ResponseEntity.ok(conversation);
        } catch (ConversationNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Conversation not found", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An error occurred", "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConversationResponse> updateConversation(
            @PathVariable String id, 
            @RequestBody ConversationRequest request) {
        return ResponseEntity.ok(conversationService.updateConversation(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteConversation(
            @PathVariable String id,
            @RequestParam(required = true) String userId) {
        conversationService.deleteOrLeaveConversation(id, userId);
        return ResponseEntity.ok(Map.of("message", "Successfully removed from conversation"));
    }
}