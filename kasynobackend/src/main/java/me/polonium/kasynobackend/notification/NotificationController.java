package me.polonium.kasynobackend.notification;

import jakarta.validation.Valid;
import me.polonium.kasynobackend.admin.AuditLogService;
import me.polonium.kasynobackend.entity.NotificationCategory;
import me.polonium.kasynobackend.notification.dto.CreateNotificationRequest;
import me.polonium.kasynobackend.notification.dto.NotificationResponse;
import me.polonium.kasynobackend.notification.dto.UserNotificationsResponse;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public NotificationController(
            NotificationService notificationService,
            UserRepository userRepository,
            AuditLogService auditLogService
    ) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/api/users/me/notifications")
    public UserNotificationsResponse getMyNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "40") int limit
    ) {
        Long userId = (Long) authentication.getPrincipal();
        return notificationService.getForUser(userId, limit);
    }

    @PostMapping("/api/users/me/notifications/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(Authentication authentication, @PathVariable Long id) {
        Long userId = (Long) authentication.getPrincipal();
        notificationService.markRead(userId, id);
    }

    @PostMapping("/api/users/me/notifications/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        notificationService.markAllRead(userId);
    }

    @GetMapping("/api/moderation/notifications")
    public NotificationPage listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid pagination parameters");
        }
        var result = notificationService.listAll(PageRequest.of(page, size));
        return new NotificationPage(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    @PostMapping("/api/moderation/notifications")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public NotificationResponse createNotification(
            @Valid @RequestBody CreateNotificationRequest request,
            Authentication authentication
    ) {
        Long actorId = (Long) authentication.getPrincipal();
        var actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Actor not found"));

        if (request.targetUserId() != null && !userRepository.existsById(request.targetUserId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Target user not found");
        }

        NotificationCategory category = request.category() == null ? NotificationCategory.NEWS : request.category();
        var created = notificationService.create(
                request.targetUserId(),
                actor.getUsername(),
                category,
                request.title(),
                request.message()
        );

        auditLogService.record(
                actorId,
                "NOTIFICATION_PUBLISHED",
                request.targetUserId() == null ? "BROADCAST" : "USER",
                request.targetUserId() == null ? "ALL" : request.targetUserId().toString(),
                "category=" + category + "; title=" + created.getTitle()
        );

        return NotificationResponse.from(created, false);
    }

    @DeleteMapping("/api/moderation/notifications/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteNotification(@PathVariable Long id, Authentication authentication) {
        Long actorId = (Long) authentication.getPrincipal();
        notificationService.delete(id);
        auditLogService.record(actorId, "NOTIFICATION_DELETED", "NOTIFICATION", id.toString(), "Notification removed");
    }

    public record NotificationPage(
            List<NotificationResponse> notifications,
            int page,
            int pageSize,
            long totalElements,
            int totalPages
    ) { }
}

