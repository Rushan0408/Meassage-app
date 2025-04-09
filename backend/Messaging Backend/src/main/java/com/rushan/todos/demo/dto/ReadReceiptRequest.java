package com.rushan.todos.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadReceiptRequest {
    private String messageId;
    private String userId;
} 