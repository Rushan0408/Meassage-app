package com.rushan.todos.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkReadReceiptRequest {
    private List<String> messageIds;
    private String userId;
} 