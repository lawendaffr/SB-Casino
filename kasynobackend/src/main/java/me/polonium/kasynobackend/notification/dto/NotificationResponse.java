package me.polonium.kasynobackend.notification.dto;

import me.polonium.kasynobackend.entity.Notification;
import me.polonium.kasynobackend.entity.NotificationCategory;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        Long targetUserId,
        String actorUsername,
        NotificationCategory category,
        String title,
        String message,
        boolean read,
        LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification n, boolean read) {
        return new NotificationResponse(
                n.getId(),
                n.getTargetUserId(),
                n.getActorUsername(),
                n.getCategory(),
                n.getTitle(),
                n.getMessage(),
                read,
                n.getCreatedAt()
        );
    }
}

