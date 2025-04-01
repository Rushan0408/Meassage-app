package com.rushan.todos.demo.controller;

import com.rushan.todos.demo.entity.user.User;
import com.rushan.todos.demo.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public Map<String, String> register(@RequestBody User user) {
        String token = authService.register(user);
        return Map.of("token ", token);
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> credentials) {
        System.out.println(credentials.get("email"));
        System.out.println(credentials.get("password"));
        String token = authService.login(credentials.get("email"), credentials.get("password"));

        return Map.of("token : ", token);
    }
    
    @CrossOrigin(origins = "*")
    @GetMapping("/me")
    public User getCurrentUser(@RequestHeader("Authorization") String token) {
        return authService.getCurrentUser(token.replace("Bearer ", ""));
    }

    @PostMapping("/refresh")
    public Map<String, String> refreshToken(@RequestHeader("Authorization") String token) {
        String newToken = authService.getCurrentUser(token.replace("Bearer ", "")).getId();
        return Map.of("token", newToken);
    }
}