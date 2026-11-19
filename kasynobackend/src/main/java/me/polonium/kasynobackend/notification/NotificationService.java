package me.polonium.kasynobackend.notification;

import me.polonium.kasynobackend.entity.Notification;
import me.polonium.kasynobackend.entity.NotificationCategory;
import me.polonium.kasynobackend.entity.NotificationRead;
import me.polonium.kasynobackend.notification.dto.NotificationResponse;
import me.polonium.kasynobackend.notification.dto.UserNotificationsResponse;
import me.polonium.kasynobackend.repository.NotificationReadRepository;
import me.polonium.kasynobackend.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            NotificationReadRepository notificationReadRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.notificationReadRepository = notificationReadRepository;
    }

    @Transactional
    public Notification create(
            Long targetUserId,
            String actorUsername,
            NotificationCategory category,
            String title,
            String message
    ) {
        Notification notification = new Notification();
        notification.setTargetUserId(targetUserId);
        notification.setActorUsername(actorUsername == null || actorUsername.isBlank() ? "SB-Casino" : actorUsername);
        notification.setCategory(category == null ? NotificationCategory.NEWS : category);
        notification.setTitle(title.trim());
        notification.setMessage(message.trim());
        notification.setCreatedAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public UserNotificationsResponse getForUser(Long userId, int limit) {
        int safeLimit = Math.min(100, Math.max(1, limit));
        List<Notification> items = notificationRepository.findForUser(userId, PageRequest.of(0, safeLimit));
        if (items.isEmpty()) {
            return new UserNotificationsResponse(List.of(), 0, 0);
        }
        List<Long> ids = items.stream().map(Notification::getId).toList();
        Set<Long> readIds = ids.isEmpty()
                ? Collections.emptySet()
                : notificationReadRepository.findReadNotificationIds(userId, ids);

        List<NotificationResponse> responses = items.stream()
                .map(n -> NotificationResponse.from(n, readIds.contains(n.getId())))
                .toList();

        long unreadCount = responses.stream().filter(r -> !r.read()).count();
        long unreadWarningsCount = responses.stream()
                .filter(r -> !r.read() && r.category() == NotificationCategory.WARNING)
                .count();

        return new UserNotificationsResponse(responses, unreadCount, unreadWarningsCount);
    }

    @Transactional
    public void markRead(Long userId, Long notificationId) {
        if (!notificationRepository.existsById(notificationId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
        }
        if (!notificationReadRepository.existsByNotificationIdAndUserId(notificationId, userId)) {
            NotificationRead read = new NotificationRead();
            read.setNotificationId(notificationId);
            read.setUserId(userId);
            read.setReadAt(LocalDateTime.now());
            notificationReadRepository.save(read);
        }
    }

    @Transactional
    public void markAllRead(Long userId) {
        List<Notification> items = notificationRepository.findForUser(userId, PageRequest.of(0, 100));
        if (items.isEmpty()) return;
        List<Long> ids = items.stream().map(Notification::getId).toList();
        Set<Long> alreadyRead = notificationReadRepository.findReadNotificationIds(userId, ids);
        LocalDateTime now = LocalDateTime.now();
        for (Notification item : items) {
            if (!alreadyRead.contains(item.getId())) {
                NotificationRead read = new NotificationRead();
                read.setNotificationId(item.getId());
                read.setUserId(userId);
                read.setReadAt(now);
                notificationReadRepository.save(read);
            }
        }
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> listAll(Pageable pageable) {
        return notificationRepository.findAllByOrderByCreatedAtDescIdDesc(pageable)
                .map(n -> NotificationResponse.from(n, false));
    }

    @Transactional
    public void delete(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
        }
        notificationRepository.deleteById(id);
    }
}

