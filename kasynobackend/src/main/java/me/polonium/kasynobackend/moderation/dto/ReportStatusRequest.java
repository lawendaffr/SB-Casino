package me.polonium.kasynobackend.moderation.dto;

import jakarta.validation.constraints.NotNull;
import me.polonium.kasynobackend.entity.UserReportStatus;

public record ReportStatusRequest(@NotNull UserReportStatus status) { }
