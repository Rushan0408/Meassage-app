package com.rushan.todos.demo.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "user_conversations")
public class UserConversation {
    @Id
    private String id;
    private String userId;
    private String conversationId;
    private boolean muted;
    private boolean pinned;
    private Date lastReadAt;
    private Date updatedAt;
}