package com.rushan.todos.demo.service;

import com.rushan.todos.demo.entity.Notification;
import com.rushan.todos.demo.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<Notification> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndIsReadFalse(userId);
    }

    public Notification markAsRead(String notificationId) {
        return notificationRepository.findById(notificationId).map(notification -> {
            notification.setRead(true);
            return notificationRepository.save(notification);
        }).orElseThrow(() -> new RuntimeException("Notification not found"));
    }

    public void markAllAsRead(String userId) {
        List<Notification> notifications = getUnreadNotifications(userId);
        notifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(notifications);
    }
}
