package com.rushan.todos.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private String id;
    private String userId;
    private String type;
    private String senderId;
    private String senderName;
    private String senderImage;
    private String conversationId;
    private String conversationName;
    private String messageId;
    private String content;
    private boolean read;
    private Date createdAt;
} 