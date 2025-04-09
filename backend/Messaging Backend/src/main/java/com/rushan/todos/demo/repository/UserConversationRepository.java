package com.rushan.todos.demo.repository;

import com.rushan.todos.demo.entity.UserConversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserConversationRepository extends MongoRepository<UserConversation, String> {
    Optional<UserConversation> findByUserIdAndConversationId(String userId, String conversationId);
} 