package com.rushan.todos.demo.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "messages")
public class Message {
    @Id
    private String id;
    private String conversationId;
    private String senderId;
    private String content;
    private List<String> attachments;
    private boolean read;
    private Date createdAt;
    private Date updatedAt;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class Attachment {
    private String type;
    private String url;
    private String name;
    private long size;
}