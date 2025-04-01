package com.rushan.todos.demo.service;

import com.rushan.todos.demo.entity.user.User;
import com.rushan.todos.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<User> getAllUsers(String search) {
        if (search == null || search.isEmpty()) {
            return userRepository.findAll();
        }
        return userRepository.findAll().stream()
                .filter(user -> user.getUsername().contains(search) || user.getEmail().contains(search))
                .toList();
    }

    public Optional<User> getUserById(String userId) {
        return userRepository.findById(userId);
    }

    public User updateUser(String userId, User updatedUser) {
        return userRepository.findById(userId).map(user -> {
            user.setUsername(updatedUser.getUsername());
            user.setEmail(updatedUser.getEmail());
            user.setFirstName(updatedUser.getFirstName());
            user.setLastName(updatedUser.getLastName());
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateUserStatus(String userId, String status) {
        return userRepository.findById(userId).map(user -> {
            user.setStatus(status);
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public String updateProfilePicture(String userId, MultipartFile file) {
        // Implement file upload logic (e.g., AWS S3, Firebase)
        return "https://example.com/profile-pic/" + userId;
    }
}