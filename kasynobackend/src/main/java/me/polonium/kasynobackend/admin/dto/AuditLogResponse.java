package me.polonium.kasynobackend.admin.dto;

import me.polonium.kasynobackend.entity.AdminAuditLog;
import java.time.LocalDateTime;

public record AuditLogResponse(Long id, Long actorUserId, String actorUsername, String action,
                               String targetType, String targetId, String details, LocalDateTime createdAt) {
    public static AuditLogResponse from(AdminAuditLog log) {
        return new AuditLogResponse(log.getId(), log.getActorUserId(), log.getActorUsername(), log.getAction(),
                log.getTargetType(), log.getTargetId(), log.getDetails(), log.getCreatedAt());
    }
}
