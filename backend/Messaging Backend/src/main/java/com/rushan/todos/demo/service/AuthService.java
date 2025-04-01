package com.rushan.todos.demo.service;

import com.rushan.todos.demo.config.JwtService;
import com.rushan.todos.demo.entity.user.User;
import com.rushan.todos.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    public String register(User user) {
        user.setPasswordHash(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        return jwtService.generateToken(user);
    }

    public String login(String email, String password) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return jwtService.generateToken(user);
    }

    public User getCurrentUser(String token) {
        String userEmail = jwtService.extractUsername(token);
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}