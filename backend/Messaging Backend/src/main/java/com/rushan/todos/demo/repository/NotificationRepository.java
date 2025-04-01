package com.rushan.todos.demo.repository;

import com.rushan.todos.demo.entity.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdAndIsReadFalse(String userId);
}
