package me.polonium.kasynobackend.repository;

import me.polonium.kasynobackend.entity.NotificationRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Set;

public interface NotificationReadRepository extends JpaRepository<NotificationRead, Long> {
    boolean existsByNotificationIdAndUserId(Long notificationId, Long userId);

    @Query("SELECT nr.notificationId FROM NotificationRead nr WHERE nr.userId = :userId AND nr.notificationId IN :notificationIds")
    Set<Long> findReadNotificationIds(@Param("userId") Long userId, @Param("notificationIds") Collection<Long> notificationIds);
}

