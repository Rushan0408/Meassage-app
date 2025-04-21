package com.rushan.todos.demo.dto;

public class UserIdRequest {
    private String userId;

    public UserIdRequest() {}
    public UserIdRequest(String userId) { this.userId = userId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
