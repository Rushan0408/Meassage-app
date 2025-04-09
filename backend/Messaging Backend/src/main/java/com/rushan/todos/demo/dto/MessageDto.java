package com.rushan.todos.demo.dto;

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
public class MessageDto {
    private String id;
    private String conversationId;
    private String senderId;
    private String senderName;
    private String content;
    private List<String> attachments;
    private boolean read;
    private Date createdAt;
    private Date updatedAt;
} 