package me.polonium.kasynobackend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "moderation_actions")
public class ModerationAction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "actor_user_id", nullable = false) private Long actorUserId;
    @Column(name = "actor_username", nullable = false, length = 50) private String actorUsername;
    @Column(name = "target_user_id", nullable = false) private Long targetUserId;
    @Column(name = "target_username", nullable = false, length = 50) private String targetUsername;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private ModerationActionType action;
    @Column(length = 500) private String reason;
    @Column(name = "expires_at") private LocalDateTime expiresAt;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @PrePersist void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }
    public Long getId() { return id; }
    public Long getActorUserId() { return actorUserId; }
    public void setActorUserId(Long id) { actorUserId = id; }
    public String getActorUsername() { return actorUsername; }
    public void setActorUsername(String username) { actorUsername = username; }
    public Long getTargetUserId() { return targetUserId; }
    public void setTargetUserId(Long id) { targetUserId = id; }
    public String getTargetUsername() { return targetUsername; }
    public void setTargetUsername(String username) { targetUsername = username; }
    public ModerationActionType getAction() { return action; }
    public void setAction(ModerationActionType action) { this.action = action; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
