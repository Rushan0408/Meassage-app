package com.rushan.todos.demo.repository;

import com.rushan.todos.demo.entity.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {
    List<Conversation> findByParticipantsContaining(String userId);
}