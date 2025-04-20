package com.rushan.todos.demo.service;

import com.rushan.todos.demo.dto.PaginatedResponse;
import com.rushan.todos.demo.entity.user.User;
import com.rushan.todos.demo.exception.UserNotFoundException;
import com.rushan.todos.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.Date;
import java.util.List;
import java.util.Optional;


@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public PaginatedResponse<User> getAllUsers(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        try {
            Page<User> userPage;
            if (search == null || search.isEmpty()) {
                userPage = userRepository.findAll(pageable);
            } else {
                // Use the repository method for search with pagination
                userPage = userRepository.findBySearchTerm(search, pageable);
            }
            
            return new PaginatedResponse<>(
                    userPage.getContent(),
                    page,
                    size,
                    userPage.getTotalElements(),
                    userPage.getTotalPages()
            );
        } catch (Exception e) {
            // Log error but return empty results to avoid frontend errors
            System.err.println("Error fetching users: " + e.getMessage());
            e.printStackTrace();
            return new PaginatedResponse<>(
                    List.of(),
                    page,
                    size,
                    0,
                    0
            );
        }
    }

    public List<User> getAllUsers(String search) {
        if (search == null || search.isEmpty()) {
            return userRepository.findAll();
        }
        return userRepository.findBySearchTerm(search);
    }

    public Optional<User> getUserById(String userId) {
        return userRepository.findById(userId);
    }

    public User updateUser(String userId, User updatedUser) {
        return userRepository.findById(userId)
                .map(user -> {
                    user.setUsername(updatedUser.getUsername());
                    user.setEmail(updatedUser.getEmail());
                    user.setFirstName(updatedUser.getFirstName());
                    user.setLastName(updatedUser.getLastName());
                    user.setUpdatedAt(new Date());
                    return userRepository.save(user);
                })
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
    }

    public User updateUserStatus(String userId, String status) {
        return userRepository.findById(userId)
                .map(user -> {
                    user.setStatus(status);
                    user.setLastSeen(new Date());
                    return userRepository.save(user);
                })
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
    }

    public String updateProfilePicture(String userId, MultipartFile file) {
        // First check if user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        
        // In a real application, implement file upload to a storage service like AWS S3
        // For now, simulate the URL
        String pictureUrl = "https://example.com/profile-pic/" + userId;
        
        // Update user profile picture URL
        user.setProfilePicture(pictureUrl);
        user.setUpdatedAt(new Date());
        userRepository.save(user);
        
        return pictureUrl;
    }
}