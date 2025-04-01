package com.rushan.todos.demo.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Document(collection = "conversations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {
    @Id
    private String id;
    private String type; // "direct" or "group"
    private String name;
    private List<String> participants;
    private List<String> admins;
    private LastMessage lastMessage;
    private Date createdAt;
    private Date updatedAt;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class LastMessage {
    private String content;
    private String senderId;
    private Date timestamp;
}