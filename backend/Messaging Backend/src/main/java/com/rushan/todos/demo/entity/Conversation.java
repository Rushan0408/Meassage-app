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
@Document(collection = "conversations")
public class Conversation {
    @Id
    private String id;
    private String name;
    private String type; // "direct" or "group"
    private List<String> participants;
    private List<String> admins;
    private Message lastMessage;
    private Date createdAt;
    private Date updatedAt;
}