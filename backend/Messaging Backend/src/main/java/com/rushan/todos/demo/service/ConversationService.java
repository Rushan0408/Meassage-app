package com.rushan.todos.demo.service;

import com.rushan.todos.demo.entity.Conversation;
import com.rushan.todos.demo.repository.ConversationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ConversationService {

    @Autowired
    private ConversationRepository conversationRepository;

    public Conversation createConversation(Conversation conversation) {
        return conversationRepository.save(conversation);
    }

    public List<Conversation> getUserConversations(String userId) {
        return conversationRepository.findByParticipantsContaining(userId);
    }

    public Conversation getConversationById(String conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
    }

    public Conversation updateConversation(String conversationId, Conversation updatedConversation) {
        return conversationRepository.findById(conversationId).map(conversation -> {
            conversation.setName(updatedConversation.getName());
            conversation.setParticipants(updatedConversation.getParticipants());
            return conversationRepository.save(conversation);
        }).orElseThrow(() -> new RuntimeException("Conversation not found"));
    }

    public void deleteConversation(String conversationId) {
        conversationRepository.deleteById(conversationId);
    }
}