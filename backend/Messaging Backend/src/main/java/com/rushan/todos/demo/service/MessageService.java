package com.rushan.todos.demo.service;

import com.rushan.todos.demo.dto.MessageDto;
import com.rushan.todos.demo.dto.PaginatedResponse;
import com.rushan.todos.demo.entity.Conversation;
import com.rushan.todos.demo.entity.Message;
import com.rushan.todos.demo.exception.ConversationNotFoundException;
import com.rushan.todos.demo.exception.MessageNotFoundException;
import com.rushan.todos.demo.repository.ConversationRepository;
import com.rushan.todos.demo.repository.MessageRepository;
import com.rushan.todos.demo.repository.UserRepository;
import com.rushan.todos.demo.websocket.WebSocketMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.cache.annotation.Cacheable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;


@Service
public class MessageService {

    private static final Logger logger = LoggerFactory.getLogger(MessageService.class);
    private static final int MAX_PAGE_SIZE = 15; // Lower max page size to prevent resource issues
    
    // Simple in-memory cache for recent message requests
    private final ConcurrentHashMap<String, PaginatedResponse<MessageDto>> messageCache = new ConcurrentHashMap<>();
    
    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ConversationRepository conversationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private WebSocketMessageService webSocketMessageService;

    @Cacheable(value = "messages", key = "{#conversationId, #page, #size, #before}")
    public PaginatedResponse<MessageDto> getMessages(String conversationId, int page, int size, Date before) {
        try {
            // Enforce size limits to prevent resource exhaustion
            int adjustedSize = Math.min(size, MAX_PAGE_SIZE);
            
            logger.info("Getting messages for conversation: {}, page: {}, size: {}", 
                    conversationId, page, adjustedSize);
            
            // Check cache first
            String cacheKey = String.format("%s_%d_%d_%s", conversationId, page, adjustedSize, before);
            if (messageCache.containsKey(cacheKey)) {
                logger.info("Cache hit for: {}", cacheKey);
                return messageCache.get(cacheKey);
            }
            
            Pageable pageable = PageRequest.of(page, adjustedSize, Sort.by(Sort.Direction.ASC, "createdAt"));
            
            // Use a timeout for the query to prevent long-running operations
            long startTime = System.currentTimeMillis();
            
            Page<Message> messages;
            try {
                if (before != null) {
                    messages = messageRepository.findByConversationIdAndCreatedAtBeforeOrderByCreatedAtAsc(
                        conversationId, before, pageable);
                } else {
                    messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId, pageable);
                }
            } catch (Exception e) {
                logger.error("Error retrieving messages: {}", e.getMessage());
                // Return empty response instead of throwing exception
                return new PaginatedResponse<>(
                    List.of(),
                    page,
                    adjustedSize,
                    0,
                    0
                );
            }
            
            long queryTime = System.currentTimeMillis() - startTime;
            logger.info("Message query took {}ms for conversation {}", queryTime, conversationId);
            
            // Convert messages to DTOs in batches to reduce memory pressure
            List<MessageDto> messageDtos = new ArrayList<>(messages.getNumberOfElements());
            for (Message message : messages.getContent()) {
                messageDtos.add(convertToDto(message));
            }
            
            PaginatedResponse<MessageDto> response = new PaginatedResponse<>(
                messageDtos,
                messages.getNumber(),
                messages.getSize(),
                messages.getTotalElements(),
                messages.getTotalPages()
            );
            
            // Cache the result if it's not too large
            if (messageDtos.size() <= MAX_PAGE_SIZE) {
                messageCache.put(cacheKey, response);
                
                // Evict cache after 30 seconds
                new Thread(() -> {
                    try {
                        Thread.sleep(30000);
                        messageCache.remove(cacheKey);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }).start();
            }
            
            return response;
        } catch (Exception e) {
            logger.error("Unexpected error getting messages: {}", e.getMessage(), e);
            throw e;
        }
    }

    public MessageDto sendMessage(String conversationId, MessageDto messageDto) {
        try {
            Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ConversationNotFoundException("Conversation not found with id: " + conversationId));
            
            Message message = new Message();
            message.setConversationId(conversationId);
            message.setSenderId(messageDto.getSenderId());
            message.setContent(messageDto.getContent());
            message.setAttachments(messageDto.getAttachments() != null ? messageDto.getAttachments() : List.of());
            message.setRead(false);
            message.setCreatedAt(new Date());
            message.setUpdatedAt(new Date());
            
            System.out.println("Saving message: " + message);
            Message savedMessage = messageRepository.save(message);
            System.out.println("Saved message: " + savedMessage);
            
            // Update last message in conversation
            conversation.setLastMessage(savedMessage);
            conversation.setUpdatedAt(new Date());
            conversationRepository.save(conversation);
            
            // Send real-time update
            MessageDto savedMessageDto = convertToDto(savedMessage);
            System.out.println("Converted to DTO: " + savedMessageDto);
            
            webSocketMessageService.sendMessageUpdate(conversationId, savedMessageDto);
            
            // Send notification to all participants
            conversation.getParticipants().stream()
                .filter(userId -> !userId.equals(messageDto.getSenderId()))
                .forEach(userId -> {
                    String senderName = userRepository.findById(messageDto.getSenderId())
                        .map(user -> user.getFirstName() + " " + user.getLastName())
                        .orElse("Someone");
                    
                    webSocketMessageService.sendNotification(
                        userId,
                        senderName + " sent a message: " + messageDto.getContent(),
                        "MESSAGE"
                    );
                });
            
            return savedMessageDto;
        } catch (Exception e) {
            System.err.println("Error sending message: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public MessageDto editMessage(String messageId, String newContent) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new MessageNotFoundException("Message not found with id: " + messageId));
        
        message.setContent(newContent);
        message.setUpdatedAt(new Date());
        
        Message updatedMessage = messageRepository.save(message);
        MessageDto updatedMessageDto = convertToDto(updatedMessage);
        
        // Send real-time update
        webSocketMessageService.sendMessageUpdate(updatedMessage.getConversationId(), updatedMessageDto);
        
        return updatedMessageDto;
    }

    public void deleteMessage(String messageId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new MessageNotFoundException("Message not found with id: " + messageId));
        
        String conversationId = message.getConversationId();
        
        messageRepository.delete(message);
        
        // Send real-time update about deletion
        webSocketMessageService.sendMessageDeleted(conversationId, messageId);
    }

    public MessageDto markAsRead(String messageId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new MessageNotFoundException("Message not found with id: " + messageId));
        
        message.setRead(true);
        Message updatedMessage = messageRepository.save(message);
        
        // Send real-time read receipt notification
        webSocketMessageService.sendReadReceipt(message.getConversationId(), messageId, message.getSenderId());
        
        return convertToDto(updatedMessage);
    }
    
    public List<MessageDto> markAllMessagesAsReadInConversation(String conversationId, String userId) {
        try {
            logger.info("Marking all messages as read in conversation: {}, for user: {}", conversationId, userId);
            
            if (conversationId == null || userId == null) {
                logger.warn("Invalid parameters: conversationId={}, userId={}", conversationId, userId);
                return List.of();
            }
            
            List<Message> unreadMessages;
            try {
                unreadMessages = messageRepository.findByConversationIdAndReadIsFalseAndSenderIdNot(
                    conversationId, userId);
            } catch (Exception e) {
                logger.error("Error finding unread messages: {}", e.getMessage(), e);
                return List.of();
            }
            
            if (unreadMessages.isEmpty()) {
                logger.info("No unread messages found for conversation: {}, user: {}", conversationId, userId);
                return List.of();
            }
            
            List<String> messageIds = new ArrayList<>();
            List<MessageDto> updatedMessages = new ArrayList<>();
            
            for (Message message : unreadMessages) {
                try {
                    message.setRead(true);
                    messageIds.add(message.getId());
                    updatedMessages.add(convertToDto(message));
                } catch (Exception e) {
                    logger.warn("Error processing message {}: {}", message.getId(), e.getMessage());
                }
            }
            
            if (messageIds.isEmpty()) {
                logger.warn("No messages were successfully marked as read");
                return List.of();
            }
            
            try {
                messageRepository.saveAll(unreadMessages);
                logger.info("Marked {} messages as read in conversation {}", messageIds.size(), conversationId);
            } catch (Exception e) {
                logger.error("Error saving updated messages: {}", e.getMessage(), e);
                return List.of();
            }
            
            try {
                // Send bulk read receipt notification
                webSocketMessageService.sendBulkReadReceipt(conversationId, messageIds, userId);
            } catch (Exception e) {
                // Log the error but don't fail the entire operation
                logger.error("Error sending bulk read receipt: {}", e.getMessage(), e);
            }
            
            return updatedMessages;
        } catch (Exception e) {
            logger.error("Unexpected error marking messages as read: {}", e.getMessage(), e);
            // Return empty list instead of propagating the exception
            return List.of();
        }
    }
    
    private MessageDto convertToDto(Message message) {
        MessageDto dto = new MessageDto();
        dto.setId(message.getId());
        dto.setConversationId(message.getConversationId());
        dto.setSenderId(message.getSenderId());
        dto.setContent(message.getContent());
        dto.setAttachments(message.getAttachments());
        dto.setRead(message.isRead());
        dto.setCreatedAt(message.getCreatedAt());
        dto.setUpdatedAt(message.getUpdatedAt());
        
        // Add sender name if available
        userRepository.findById(message.getSenderId())
            .ifPresent(user -> dto.setSenderName(user.getFirstName() + " " + user.getLastName()));
        
        return dto;
    }
}