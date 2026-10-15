package me.polonium.kasynobackend.moderation.dto;

import me.polonium.kasynobackend.entity.UserReport;
import me.polonium.kasynobackend.entity.UserReportStatus;
import java.time.LocalDateTime;

public record UserReportResponse(Long id, Long reporterUserId, String reporterUsername,
                                 Long targetUserId, String targetUsername, String reason,
                                 UserReportStatus status, LocalDateTime createdAt) {
    public static UserReportResponse from(UserReport report) {
        return new UserReportResponse(report.getId(), report.getReporter() == null ? null : report.getReporter().getId(),
                report.getReporterUsername(), report.getTargetUserId(), report.getTargetUsername(),
                report.getReason(), report.getStatus(), report.getCreatedAt());
    }
}
