package com.rushan.todos.demo.controller;

import com.rushan.todos.demo.dto.PaginatedResponse;
import com.rushan.todos.demo.dto.UserProfileResponse;
import com.rushan.todos.demo.entity.user.User;
import com.rushan.todos.demo.exception.UserNotFoundException;
import com.rushan.todos.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<UserProfileResponse>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        PaginatedResponse<User> paginatedUsers = userService.getAllUsers(search, page, size);
        
        List<UserProfileResponse> userResponses = paginatedUsers.getContent().stream()
                .map(this::mapToUserProfile)
                .collect(Collectors.toList());
        
        PaginatedResponse<UserProfileResponse> response = new PaginatedResponse<>(
                userResponses,
                paginatedUsers.getPage(),
                paginatedUsers.getSize(),
                paginatedUsers.getTotalElements(),
                paginatedUsers.getTotalPages()
        );
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserProfileResponse>> getAllUsersWithoutPagination(
            @RequestParam(required = false) String search) {
        
        List<User> users = userService.getAllUsers(search);
        
        List<UserProfileResponse> userResponses = users.stream()
                .map(this::mapToUserProfile)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(userResponses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResponse> getUserById(@PathVariable String id) {
        User user = userService.getUserById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
        return ResponseEntity.ok(mapToUserProfile(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserProfileResponse> updateUser(@PathVariable String id, @RequestBody User updatedUser) {
        User user = userService.updateUser(id, updatedUser);
        return ResponseEntity.ok(mapToUserProfile(user));
    }

    @PutMapping("/status")
    public ResponseEntity<UserProfileResponse> updateUserStatus(@RequestBody Map<String, String> statusUpdate) {
        String userId = statusUpdate.get("userId");
        String status = statusUpdate.get("status");
        
        if (userId == null || userId.isEmpty()) {
            throw new IllegalArgumentException("User ID is required");
        }
        
        if (status == null || status.isEmpty()) {
            throw new IllegalArgumentException("Status is required");
        }
        
        User user = userService.updateUserStatus(userId, status);
        return ResponseEntity.ok(mapToUserProfile(user));
    }

    @PutMapping("/profile-picture")
    public ResponseEntity<Map<String, String>> updateProfilePicture(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") String userId) {
        String pictureUrl = userService.updateProfilePicture(userId, file);
        return ResponseEntity.ok(Map.of("pictureUrl", pictureUrl));
    }
    
    // Helper method to map User to UserProfileResponse
    private UserProfileResponse mapToUserProfile(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .profilePicture(user.getProfilePicture())
                .status(user.getStatus())
                .lastSeen(user.getLastSeen())
                .build();
    }
}
