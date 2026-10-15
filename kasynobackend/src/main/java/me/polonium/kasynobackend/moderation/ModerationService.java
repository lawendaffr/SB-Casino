package me.polonium.kasynobackend.moderation;

import me.polonium.kasynobackend.admin.AuditLogService;
import me.polonium.kasynobackend.entity.*;
import me.polonium.kasynobackend.repository.ModerationActionRepository;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class ModerationService {
    private final UserRepository users;
    private final ModerationActionRepository actions;
    private final AuditLogService audit;

    public ModerationService(UserRepository users, ModerationActionRepository actions, AuditLogService audit) {
        this.users = users;
        this.actions = actions;
        this.audit = audit;
    }

    @Transactional
    public ModerationAction apply(Long actorId, Long targetId, ModerationActionType type,
                                  String reason, Integer hours) {
        User actor = users.findById(actorId).orElseThrow();
        User target = users.findByIdForUpdate(targetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (actorId.equals(targetId)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "You cannot moderate your own account");
        if (actor.getRole() == UserRole.MODERATOR && target.getRole() != UserRole.USER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Moderators can only act on player accounts");
        }
        LocalDateTime expiresAt = null;
        switch (type) {
            case TIMEOUT -> {
                if (hours == null || hours < 1 || hours > 720) throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Timeout must be between 1 and 720 hours");
                expiresAt = LocalDateTime.now().plusHours(hours);
                target.setSuspendedUntil(expiresAt);
            }
            case BAN -> {
                target.setAccountStatus(AccountStatus.BANNED);
                target.setSuspendedUntil(null);
            }
            case UNBAN -> {
                target.setAccountStatus(AccountStatus.ACTIVE);
                target.setSuspendedUntil(null);
            }
            case WARNING -> { }
        }
        ModerationAction action = new ModerationAction();
        action.setActorUserId(actorId);
        action.setActorUsername(actor.getUsername());
        action.setTargetUserId(targetId);
        action.setTargetUsername(target.getUsername());
        action.setAction(type);
        action.setReason(reason);
        action.setExpiresAt(expiresAt);
        ModerationAction saved = actions.save(action);
        audit.record(actorId, "MODERATION_" + type.name(), "USER", targetId.toString(), reason);
        return saved;
    }
}
