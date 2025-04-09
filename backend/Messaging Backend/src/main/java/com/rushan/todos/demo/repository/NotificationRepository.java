package com.rushan.todos.demo.repository;

import com.rushan.todos.demo.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdAndIsReadFalse(String userId);
    Page<Notification> findByUserIdAndIsReadFalse(String userId, Pageable pageable);
    Page<Notification> findByUserId(String userId, Pageable pageable);
    long countByUserIdAndIsReadFalse(String userId);
}
