package com.rushan.todos.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserConversationDto {
    private String id;
    private String userId;
    private String conversationId;
    private boolean muted;
    private boolean pinned;
    private Date lastReadAt;
    private Date updatedAt;
} 