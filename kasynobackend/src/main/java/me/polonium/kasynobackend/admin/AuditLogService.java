package me.polonium.kasynobackend.admin;

import me.polonium.kasynobackend.entity.AdminAuditLog;
import me.polonium.kasynobackend.repository.AdminAuditLogRepository;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {
    private final AdminAuditLogRepository logs;
    private final UserRepository users;

    public AuditLogService(AdminAuditLogRepository logs, UserRepository users) {
        this.logs = logs;
        this.users = users;
    }

    @Transactional
    public void record(Long actorId, String action, String targetType, String targetId, String details) {
        var actor = users.findById(actorId).orElseThrow();
        AdminAuditLog log = new AdminAuditLog();
        log.setActorUserId(actorId);
        log.setActorUsername(actor.getUsername());
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setDetails(details);
        logs.save(log);
    }
}
