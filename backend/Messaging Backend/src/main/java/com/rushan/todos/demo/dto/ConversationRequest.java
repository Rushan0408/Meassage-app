package com.rushan.todos.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConversationRequest {
    private String type;         // "direct" or "group"
    private String name;         // Optional for group chats
    private List<String> participants;
} 