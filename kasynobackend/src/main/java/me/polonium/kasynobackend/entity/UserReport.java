package me.polonium.kasynobackend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_reports")
public class UserReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_user_id")
    private User reporter;

    @Column(name = "reporter_username", nullable = false, length = 50)
    private String reporterUsername;

    @Column(name = "target_user_id", nullable = false)
    private Long targetUserId;

    @Column(name = "target_username", nullable = false, length = 50)
    private String targetUsername;

    @Column(nullable = false, length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserReportStatus status = UserReportStatus.OPEN;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = UserReportStatus.OPEN;
    }

    public Long getId() { return id; }
    public User getReporter() { return reporter; }
    public void setReporter(User reporter) { this.reporter = reporter; }
    public String getReporterUsername() { return reporterUsername; }
    public void setReporterUsername(String reporterUsername) { this.reporterUsername = reporterUsername; }
    public Long getTargetUserId() { return targetUserId; }
    public void setTargetUserId(Long targetUserId) { this.targetUserId = targetUserId; }
    public String getTargetUsername() { return targetUsername; }
    public void setTargetUsername(String targetUsername) { this.targetUsername = targetUsername; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public UserReportStatus getStatus() { return status; }
    public void setStatus(UserReportStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
