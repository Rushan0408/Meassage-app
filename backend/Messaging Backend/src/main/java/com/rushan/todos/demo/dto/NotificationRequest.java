package com.rushan.todos.demo.dto;

public class NotificationRequest {
    private String message;

    public NotificationRequest() {}
    public NotificationRequest(String message) { this.message = message; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
