package com.rushan.todos.demo.dto;

import com.rushan.todos.demo.entity.Conversation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConversationResponse {
    private String id;
    private String type;             // "direct" or "group"
    private String name;
    private List<UserProfileResponse> participants;
    private List<String> adminIds;
    private LastMessageDto lastMessage;
    private Date createdAt;
    private Date updatedAt;
    
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LastMessageDto {
        private String content;
        private String senderId;
        private String senderName;
        private Date timestamp;
    }
    
    public static ConversationResponse fromConversation(Conversation conversation, List<UserProfileResponse> participantDetails) {
        final LastMessageDto lastMessageDto;
        
        if (conversation.getLastMessage() != null) {
            try {
                lastMessageDto = LastMessageDto.builder()
                        .content(conversation.getLastMessage().getContent())
                        .senderId(conversation.getLastMessage().getSenderId())
                        .timestamp(conversation.getLastMessage().getCreatedAt())
                        .build();
                        
                // Add sender name if we can find it
                if (lastMessageDto.getSenderId() != null) {
                    participantDetails.stream()
                        .filter(user -> user.getId() != null && user.getId().equals(lastMessageDto.getSenderId()))
                        .findFirst()
                        .ifPresent(user -> lastMessageDto.setSenderName(
                            (user.getFirstName() != null ? user.getFirstName() : "") + " " + 
                            (user.getLastName() != null ? user.getLastName() : "")
                        ));
                }
            } catch (Exception e) {
                // Log error and return null for last message if there's an issue
                System.err.println("Error converting last message: " + e.getMessage());
                e.printStackTrace();
                return ConversationResponse.builder()
                        .id(conversation.getId())
                        .type(conversation.getType())
                        .name(conversation.getName())
                        .participants(participantDetails)
                        .adminIds(conversation.getAdmins())
                        .lastMessage(null)
                        .createdAt(conversation.getCreatedAt())
                        .updatedAt(conversation.getUpdatedAt())
                        .build();
            }
        } else {
            lastMessageDto = null;
        }
        
        return ConversationResponse.builder()
                .id(conversation.getId())
                .type(conversation.getType())
                .name(conversation.getName())
                .participants(participantDetails)
                .adminIds(conversation.getAdmins())
                .lastMessage(lastMessageDto)
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }
} 