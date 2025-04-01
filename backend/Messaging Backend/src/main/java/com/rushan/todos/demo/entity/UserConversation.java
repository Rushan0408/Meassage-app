package com.rushan.todos.demo.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.Map;

@Document(collection = "user_conversations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserConversation {
    @Id
    private String id;
    private String userId;
    private String conversationId;
    private Map<String, String> nicknames;
    private boolean muted;
    private boolean pinned;
    private boolean archived;
    private int unreadCount;
    private String lastReadMessageId;
    private Date createdAt;
    private Date updatedAt;
}