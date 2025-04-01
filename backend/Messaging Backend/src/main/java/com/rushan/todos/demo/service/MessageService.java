package com.rushan.todos.demo.service;

import com.rushan.todos.demo.entity.Message;
import com.rushan.todos.demo.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    public List<Message> getMessagesByConversation(String conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    public Message sendMessage(Message message) {
        return messageRepository.save(message);
    }

    public Message editMessage(String messageId, String newContent) {
        return messageRepository.findById(messageId).map(message -> {
            message.setContent(newContent);
            message.setEdited(true);
            return messageRepository.save(message);
        }).orElseThrow(() -> new RuntimeException("Message not found"));
    }

    public void deleteMessage(String messageId) {
        messageRepository.deleteById(messageId);
    }
}