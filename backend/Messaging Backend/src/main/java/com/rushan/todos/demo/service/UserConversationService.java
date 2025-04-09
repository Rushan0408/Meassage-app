package com.rushan.todos.demo.service;

import com.rushan.todos.demo.dto.UserConversationDto;
import com.rushan.todos.demo.entity.UserConversation;
import com.rushan.todos.demo.repository.MessageRepository;
import com.rushan.todos.demo.repository.UserConversationRepository;
import com.rushan.todos.demo.websocket.WebSocketMessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class UserConversationService {

    private static final Logger logger = LoggerFactory.getLogger(UserConversationService.class);
    
    @Autowired
    private UserConversationRepository userConversationRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private WebSocketMessageService webSocketMessageService;
    
    @Autowired
    private MessageService messageService;
    
    public UserConversationDto updateSettings(String userId, String conversationId, Boolean muted, Boolean pinned) {
        UserConversation userConversation = userConversationRepository
            .findByUserIdAndConversationId(userId, conversationId)
            .orElseGet(() -> {
                UserConversation newUserConversation = new UserConversation();
                newUserConversation.setUserId(userId);
                newUserConversation.setConversationId(conversationId);
                newUserConversation.setLastReadAt(new Date());
                return newUserConversation;
            });
        
        if (muted != null) {
            userConversation.setMuted(muted);
        }
        
        if (pinned != null) {
            userConversation.setPinned(pinned);
        }
        
        userConversation.setUpdatedAt(new Date());
        
        UserConversation savedUserConversation = userConversationRepository.save(userConversation);
        
        // Notify clients about the update
        webSocketMessageService.sendConversationUpdate(conversationId);
        
        return convertToDto(savedUserConversation);
    }
    
    public UserConversationDto markConversationAsRead(String userId, String conversationId) {
        try {
            logger.info("Marking conversation as read: userId={}, conversationId={}", userId, conversationId);
            
            if (userId == null || userId.trim().isEmpty()) {
                logger.error("Invalid userId provided: {}", userId);
                throw new IllegalArgumentException("userId cannot be null or empty");
            }
            
            if (conversationId == null || conversationId.trim().isEmpty()) {
                logger.error("Invalid conversationId provided: {}", conversationId);
                throw new IllegalArgumentException("conversationId cannot be null or empty");
            }
            
            UserConversation userConversation = userConversationRepository
                .findByUserIdAndConversationId(userId, conversationId)
                .orElseGet(() -> {
                    logger.info("Creating new UserConversation for userId={}, conversationId={}", userId, conversationId);
                    UserConversation newUserConversation = new UserConversation();
                    newUserConversation.setUserId(userId);
                    newUserConversation.setConversationId(conversationId);
                    return newUserConversation;
                });
            
            Date now = new Date();
            userConversation.setLastReadAt(now);
            userConversation.setUpdatedAt(now);
            
            UserConversation savedUserConversation = userConversationRepository.save(userConversation);
            logger.debug("Saved UserConversation: {}", savedUserConversation.getId());
            
            try {
                // Mark all unread messages in this conversation as read
                messageService.markAllMessagesAsReadInConversation(conversationId, userId);
            } catch (Exception e) {
                // Log the error but don't fail the entire operation
                logger.error("Error marking messages as read: {}", e.getMessage(), e);
            }
            
            try {
                // Notify clients about the update
                webSocketMessageService.sendConversationUpdate(conversationId);
            } catch (Exception e) {
                // Log the error but don't fail the entire operation
                logger.error("Error sending WebSocket update: {}", e.getMessage(), e);
            }
            
            return convertToDto(savedUserConversation);
        } catch (Exception e) {
            logger.error("Failed to mark conversation as read: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    private UserConversationDto convertToDto(UserConversation userConversation) {
        return UserConversationDto.builder()
            .id(userConversation.getId())
            .userId(userConversation.getUserId())
            .conversationId(userConversation.getConversationId())
            .muted(userConversation.isMuted())
            .pinned(userConversation.isPinned())
            .lastReadAt(userConversation.getLastReadAt())
            .updatedAt(userConversation.getUpdatedAt())
            .build();
    }
}
 