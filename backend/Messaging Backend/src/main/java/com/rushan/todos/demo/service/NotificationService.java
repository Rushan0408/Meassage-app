package com.rushan.todos.demo.service;

import com.rushan.todos.demo.dto.NotificationDto;
import com.rushan.todos.demo.dto.PaginatedResponse;
import com.rushan.todos.demo.entity.Notification;

import com.rushan.todos.demo.repository.NotificationRepository;
import com.rushan.todos.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;

    public List<Notification> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndIsReadFalse(userId);
    }
    
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
    
    public PaginatedResponse<NotificationDto> getUserNotifications(
            String userId, int page, int size, boolean unreadOnly) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<Notification> notificationsPage;
        if (unreadOnly) {
            notificationsPage = notificationRepository.findByUserIdAndIsReadFalse(userId, pageable);
        } else {
            notificationsPage = notificationRepository.findByUserId(userId, pageable);
        }
        
        List<NotificationDto> notificationDtos = notificationsPage.getContent()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        
        return new PaginatedResponse<>(
                notificationDtos,
                notificationsPage.getNumber(),
                notificationsPage.getSize(),
                notificationsPage.getTotalElements(),
                notificationsPage.getTotalPages()
        );
    }

    public NotificationDto markAsRead(String notificationId) {
        return notificationRepository.findById(notificationId).map(notification -> {
            notification.setRead(true);
            return convertToDto(notificationRepository.save(notification));
        }).orElseThrow(() -> new RuntimeException("Notification not found"));
    }

    public void markAllAsRead(String userId) {
        List<Notification> notifications = getUnreadNotifications(userId);
        notifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(notifications);
    }
    
    private NotificationDto convertToDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setUserId(notification.getUserId());
        dto.setType(notification.getType());
        dto.setSenderId(notification.getSenderId());
        dto.setConversationId(notification.getConversationId());
        dto.setMessageId(notification.getMessageId());
        dto.setContent(notification.getContent());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt());
        
        // Fetch sender information if available
        if (notification.getSenderId() != null) {
            userRepository.findById(notification.getSenderId()).ifPresent(sender -> {
                dto.setSenderName(sender.getFirstName() + " " + sender.getLastName());
                dto.setSenderImage(sender.getProfilePicture());
            });
        }
        
        return dto;
    }
}
