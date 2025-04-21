package com.rushan.todos.demo.controller;

import com.rushan.todos.demo.dto.UserConversationDto;
import com.rushan.todos.demo.service.UserConversationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", 
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api/user-conversations")
public class UserConversationController {

    private static final Logger logger = LoggerFactory.getLogger(UserConversationController.class);

    @Autowired
    private UserConversationService userConversationService;

    @PutMapping("/{conversationId}")
    public ResponseEntity<?> updateUserConversationSettings(
            @PathVariable String conversationId,
            @RequestBody Map<String, Object> settings) {
        
        try {
            String userId = (String) settings.get("userId");
            Boolean muted = (Boolean) settings.get("muted");
            Boolean pinned = (Boolean) settings.get("pinned");
            
            UserConversationDto result = userConversationService.updateSettings(userId, conversationId, muted, pinned);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error updating conversation settings: {}", e.getMessage(), e);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to update conversation settings");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{conversationId}/read")
    public ResponseEntity<?> markConversationAsRead(
            @PathVariable String conversationId,
            @RequestBody(required = false) com.rushan.todos.demo.dto.UserIdRequest request,
            @RequestParam(required = false) String userId) {
        
        try {
            // Get userId from either request body or request parameter
            String userIdToUse = userId;
            // If userId is not provided as a parameter, try to get it from the request body DTO
            if (userIdToUse == null && request != null) {
                userIdToUse = request.getUserId();
            }
            
            // Log the request for debugging
            logger.info("markConversationAsRead - conversationId: {}, userId: {}", conversationId, userIdToUse);
            
            if (userIdToUse == null || userIdToUse.trim().isEmpty()) {
                Map<String, String> response = new HashMap<>();
                response.put("error", "Invalid request");
                response.put("message", "userId is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (conversationId == null || conversationId.trim().isEmpty()) {
                Map<String, String> response = new HashMap<>();
                response.put("error", "Invalid request");
                response.put("message", "conversationId is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            UserConversationDto result = userConversationService.markConversationAsRead(userIdToUse, conversationId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error marking conversation as read: {}", e.getMessage(), e);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to mark conversation as read");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
} 