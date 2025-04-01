package com.rushan.todos.demo.controller;

import com.rushan.todos.demo.entity.Notification;
import com.rushan.todos.demo.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public List<Notification> getNotifications(@RequestParam String userId) {
        return notificationService.getUnreadNotifications(userId);
    }

    @PutMapping("/{id}/read")
    public Notification markAsRead(@PathVariable String id) {
        return notificationService.markAsRead(id);
    }
}
