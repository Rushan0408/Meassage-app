package com.rushan.todos.demo.controller;

import com.rushan.todos.demo.entity.user.User;
import com.rushan.todos.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;
@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUsers(@RequestParam(required = false) String search) {
        return userService.getAllUsers(search);
    }

    @GetMapping("/{id}")
    public Optional<User> getUserById(@PathVariable String id) {
        return userService.getUserById(id);
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable String id, @RequestBody User updatedUser) {
        return userService.updateUser(id, updatedUser);
    }

    @PutMapping("/status")
    public User updateUserStatus(@RequestBody Map<String, String> statusUpdate) {
        return userService.updateUserStatus(statusUpdate.get("userId"), statusUpdate.get("status"));
    }

    @PutMapping("/profile-picture")
    public String updateProfilePicture(@RequestParam("file") MultipartFile file, @RequestParam("userId") String userId) {
        return userService.updateProfilePicture(userId, file);
    }
}
