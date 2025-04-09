package com.rushan.todos.demo.repository;

import com.rushan.todos.demo.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Date;
import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByConversationIdOrderByCreatedAtAsc(String conversationId);
    
    Page<Message> findByConversationIdOrderByCreatedAtAsc(String conversationId, Pageable pageable);
    
    Page<Message> findByConversationIdOrderByCreatedAtDesc(String conversationId, Pageable pageable);
    
    Page<Message> findByConversationIdAndCreatedAtBeforeOrderByCreatedAtAsc(
            String conversationId, Date before, Pageable pageable);
    
    Page<Message> findByConversationIdAndCreatedAtBeforeOrderByCreatedAtDesc(
            String conversationId, Date before, Pageable pageable);
    
    List<Message> findByConversationIdAndReadIsFalseAndSenderIdNot(
            String conversationId, String senderId);
}
