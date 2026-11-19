package me.polonium.kasynobackend.notification.dto;

import java.util.List;

public record UserNotificationsResponse(
        List<NotificationResponse> notifications,
        long unreadCount,
        long unreadWarningsCount
) { }

