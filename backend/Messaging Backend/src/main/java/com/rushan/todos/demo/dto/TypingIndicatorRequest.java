package com.rushan.todos.demo.dto;

public class TypingIndicatorRequest {
    private String status;

    public TypingIndicatorRequest() {}
    public TypingIndicatorRequest(String status) { this.status = status; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
