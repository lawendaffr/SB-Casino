package me.polonium.kasynobackend.moderation.dto;

import me.polonium.kasynobackend.entity.ModerationAction;
import me.polonium.kasynobackend.entity.ModerationActionType;
import java.time.LocalDateTime;

public record ModerationActionResponse(Long id, Long actorUserId, String actorUsername,
                                       Long targetUserId, String targetUsername,
                                       ModerationActionType action, String reason,
                                       LocalDateTime expiresAt, LocalDateTime createdAt) {
    public static ModerationActionResponse from(ModerationAction action) {
        return new ModerationActionResponse(action.getId(), action.getActorUserId(), action.getActorUsername(),
                action.getTargetUserId(), action.getTargetUsername(), action.getAction(), action.getReason(),
                action.getExpiresAt(), action.getCreatedAt());
    }
}
