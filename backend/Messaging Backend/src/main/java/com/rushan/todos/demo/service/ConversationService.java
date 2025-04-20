package com.rushan.todos.demo.service;

import com.rushan.todos.demo.dto.ConversationRequest;
import com.rushan.todos.demo.dto.ConversationResponse;
import com.rushan.todos.demo.dto.PaginatedResponse;
import com.rushan.todos.demo.dto.UserProfileResponse;
import com.rushan.todos.demo.entity.Conversation;

import com.rushan.todos.demo.entity.user.User;
import com.rushan.todos.demo.exception.ConversationNotFoundException;
import com.rushan.todos.demo.repository.ConversationRepository;
import com.rushan.todos.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import java.util.stream.Collectors;

@Service
public class ConversationService {

    @Autowired
    private ConversationRepository conversationRepository;
    
    @Autowired
    private UserRepository userRepository;

    public Conversation createConversation(Conversation conversation) {
        conversation.setCreatedAt(new Date());
        conversation.setUpdatedAt(new Date());
        return conversationRepository.save(conversation);
    }
    
    public ConversationResponse createConversation(ConversationRequest request) {
        Conversation conversation = new Conversation();
        conversation.setType(request.getType());
        conversation.setName(request.getName());
        conversation.setParticipants(request.getParticipants());
        conversation.setCreatedAt(new Date());
        conversation.setUpdatedAt(new Date());
        
        // For direct messages, validate there are exactly 2 participants
        if ("direct".equals(request.getType()) && 
            (request.getParticipants() == null || request.getParticipants().size() != 2)) {
            throw new IllegalArgumentException("Direct conversations must have exactly 2 participants");
        }
        
        // For group chats, set creator as admin
        if ("group".equals(request.getType()) && request.getParticipants() != null && 
                !request.getParticipants().isEmpty()) {
            conversation.setAdmins(List.of(request.getParticipants().get(0)));
        }
        
        Conversation savedConversation = conversationRepository.save(conversation);
        return getConversationByIdWithDetails(savedConversation.getId());
    }

    public List<Conversation> getUserConversations(String userId) {
        return conversationRepository.findByParticipantsContaining(userId);
    }
    
    public PaginatedResponse<Conversation> getUserConversations(String userId, int page, int size) {

        // Since MongoDB repository doesn't directly support pagination with complex queries,
        // we'll get all matching conversations and manually paginate
        List<Conversation> allConversations = conversationRepository.findByParticipantsContaining(userId);
        
        // Sort conversations by updatedAt (descending)
        allConversations.sort((c1, c2) -> {
            if (c1.getUpdatedAt() == null && c2.getUpdatedAt() == null) return 0;
            if (c1.getUpdatedAt() == null) return 1;
            if (c2.getUpdatedAt() == null) return -1;
            return c2.getUpdatedAt().compareTo(c1.getUpdatedAt());
        });
        
        int totalElements = allConversations.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        
        int start = page * size;
        int end = Math.min(start + size, totalElements);
        
        List<Conversation> pageContent = start < end 
                ? allConversations.subList(start, end) 
                : new ArrayList<>();
        
        return new PaginatedResponse<Conversation>(
                pageContent,
                page,
                size,
                totalElements,
                totalPages
        );
    }
    
    public PaginatedResponse<ConversationResponse> getUserConversationsWithDetails(String userId, int page, int size) {
        // Get paginated conversations first
        PaginatedResponse<Conversation> conversationsPage = getUserConversations(userId, page, size);
        
        // Convert to ConversationResponse with user details
        List<ConversationResponse> conversationResponses = conversationsPage.getContent().stream()
                .map(conversation -> {
                    List<User> participants = userRepository.findAllById(conversation.getParticipants());
                    List<UserProfileResponse> participantProfiles = participants.stream()
                            .map(user -> UserProfileResponse.builder()
                                    .id(user.getId())
                                    .username(user.getUsername())
                                    .email(user.getEmail())
                                    .firstName(user.getFirstName())
                                    .lastName(user.getLastName())
                                    .profilePicture(user.getProfilePicture())
                                    .status(user.getStatus())
                                    .lastSeen(user.getLastSeen())
                                    .build())
                            .collect(Collectors.toList());
                    
                    return ConversationResponse.fromConversation(conversation, participantProfiles);
                })
                .collect(Collectors.toList());
        
        return new PaginatedResponse<ConversationResponse>(
                conversationResponses,
                conversationsPage.getPage(),
                conversationsPage.getSize(),
                conversationsPage.getTotalElements(),
                conversationsPage.getTotalPages()
        );
    }

    public Conversation getConversationById(String conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ConversationNotFoundException("Conversation not found with id: " + conversationId));
    }
    
    public ConversationResponse getConversationByIdWithDetails(String conversationId) {
        try {
            Conversation conversation = getConversationById(conversationId);
            
            // Get participant details
            List<User> participants = userRepository.findAllById(conversation.getParticipants());
            List<UserProfileResponse> participantProfiles = participants.stream()
                    .map(user -> UserProfileResponse.builder()
                            .id(user.getId())
                            .username(user.getUsername())
                            .email(user.getEmail())
                            .firstName(user.getFirstName())
                            .lastName(user.getLastName())
                            .profilePicture(user.getProfilePicture())
                            .status(user.getStatus())
                            .lastSeen(user.getLastSeen())
                            .build())
                    .collect(Collectors.toList());
            
            return ConversationResponse.fromConversation(conversation, participantProfiles);
        } catch (ConversationNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error getting conversation details: " + e.getMessage(), e);
        }
    }

    public Conversation updateConversation(String conversationId, Conversation updatedConversation) {
        return conversationRepository.findById(conversationId).map(conversation -> {
            // Update basic properties
            if (updatedConversation.getName() != null) {
                conversation.setName(updatedConversation.getName());
            }
            
            // Update participants if provided
            if (updatedConversation.getParticipants() != null) {
                conversation.setParticipants(updatedConversation.getParticipants());
            }
            
            // Update admin list if provided
            if (updatedConversation.getAdmins() != null) {
                conversation.setAdmins(updatedConversation.getAdmins());
            }
            
            // Update timestamp
            conversation.setUpdatedAt(new Date());
            
            return conversationRepository.save(conversation);
        }).orElseThrow(() -> new RuntimeException("Conversation not found"));
    }
    
    public ConversationResponse updateConversation(String conversationId, ConversationRequest request) {
        Conversation conversation = getConversationById(conversationId);
        
        // Update the fields that are provided
        if (request.getName() != null) {
            conversation.setName(request.getName());
        }
        
        if (request.getParticipants() != null) {
            conversation.setParticipants(request.getParticipants());
        }
        
        // Update timestamp
        conversation.setUpdatedAt(new Date());
        
        // Save the updated conversation
        conversationRepository.save(conversation);
        
        // Return with detailed response
        return getConversationByIdWithDetails(conversationId);
    }

    public void deleteConversation(String conversationId) {
        conversationRepository.deleteById(conversationId);
    }
    
    public void deleteOrLeaveConversation(String conversationId, String userId) {
        Conversation conversation = getConversationById(conversationId);
        
        // For group conversations, the user leaves the group
        if ("group".equals(conversation.getType()) && conversation.getParticipants().size() > 2) {
            // Remove the user from participants
            List<String> updatedParticipants = conversation.getParticipants().stream()
                    .filter(participantId -> !participantId.equals(userId))
                    .collect(Collectors.toList());
            conversation.setParticipants(updatedParticipants);
            
            // Also remove from admins if they were an admin
            if (conversation.getAdmins() != null && conversation.getAdmins().contains(userId)) {
                List<String> updatedAdmins = conversation.getAdmins().stream()
                        .filter(adminId -> !adminId.equals(userId))
                        .collect(Collectors.toList());
                conversation.setAdmins(updatedAdmins);
            }
            
            // Update the conversation
            conversation.setUpdatedAt(new Date());
            conversationRepository.save(conversation);
        } else {
            // For direct conversations or if it's the last/second-to-last person in a group, delete the conversation
            conversationRepository.deleteById(conversationId);
        }
    }
}