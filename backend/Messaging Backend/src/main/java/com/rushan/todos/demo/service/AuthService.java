package com.rushan.todos.demo.service;

import com.rushan.todos.demo.config.JwtService;
import com.rushan.todos.demo.dto.AuthRequest;
import com.rushan.todos.demo.dto.AuthResponse;
import com.rushan.todos.demo.dto.RegisterRequest;
import com.rushan.todos.demo.entity.user.Role;
import com.rushan.todos.demo.entity.user.User;
import com.rushan.todos.demo.exception.AuthException;
import com.rushan.todos.demo.exception.UserNotFoundException;
import com.rushan.todos.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
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

    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("Email already in use");
        }
        
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AuthException("Username already in use");
        }
        
        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setStatus("offline");
        user.setCreatedAt(new Date());
        user.setUpdatedAt(new Date());

        user = userRepository.save(user);
        
        // Generate token
        String token = jwtService.generateToken(user);
        
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new UserNotFoundException("User not found"));
            
            // Update user status
            user.setStatus("online");
            user.setLastSeen(new Date());
            userRepository.save(user);
            
            // Generate token
            String token = jwtService.generateToken(user);
            
            return AuthResponse.builder()
                    .token(token)
                    .userId(user.getId())
                    .build();
                    
        } catch (BadCredentialsException e) {
            throw new AuthException("Invalid email or password");
        }
    }

    public AuthResponse refreshToken(String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new AuthException("Invalid token format");
        }
        
        String tokenValue = token.substring(7);
        String userEmail = jwtService.extractUsername(tokenValue);
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        
        // Generate new token
        String newToken = jwtService.generateToken(user);
        
        return AuthResponse.builder()
                .token(newToken)
                .userId(user.getId())
                .build();
    }

    public User getCurrentUser(String token) {
        if (token == null) {
            throw new AuthException("Token is required");
        }
        
        String userEmail = jwtService.extractUsername(token);
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }
    
    public void resetPassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
        
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(new Date());
        userRepository.save(user);
    }
    
    public void logout(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        
        user.setStatus("offline");
        user.setLastSeen(new Date());
        userRepository.save(user);
    }
}