package me.polonium.kasynobackend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_audit_logs")
public class AdminAuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "actor_user_id", nullable = false) private Long actorUserId;
    @Column(name = "actor_username", nullable = false, length = 50) private String actorUsername;
    @Column(nullable = false, length = 60) private String action;
    @Column(name = "target_type", nullable = false, length = 40) private String targetType;
    @Column(name = "target_id", length = 80) private String targetId;
    @Column(length = 1000) private String details;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @PrePersist void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }
    public Long getId() { return id; }
    public Long getActorUserId() { return actorUserId; }
    public void setActorUserId(Long id) { actorUserId = id; }
    public String getActorUsername() { return actorUsername; }
    public void setActorUsername(String username) { actorUsername = username; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
