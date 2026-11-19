package me.polonium.kasynobackend.repository;

import me.polonium.kasynobackend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    @Query("SELECT n FROM Notification n WHERE n.targetUserId IS NULL OR n.targetUserId = :userId ORDER BY n.createdAt DESC, n.id DESC")
    List<Notification> findForUser(@Param("userId") Long userId, Pageable pageable);

    Page<Notification> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);
}

