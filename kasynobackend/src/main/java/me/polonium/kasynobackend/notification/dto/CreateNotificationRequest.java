package me.polonium.kasynobackend.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import me.polonium.kasynobackend.entity.NotificationCategory;

public record CreateNotificationRequest(
        Long targetUserId,
        NotificationCategory category,
        @NotBlank @Size(max = 140) String title,
        @NotBlank @Size(max = 1000) String message
) { }

