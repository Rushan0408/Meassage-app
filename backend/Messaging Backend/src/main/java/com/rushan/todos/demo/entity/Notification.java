package com.rushan.todos.demo.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    private String id;
    private String userId;
    private String type;
    private String senderId;
    private String conversationId;
    private String messageId;
    private String content;
    private boolean isRead;
    private Date createdAt;
}