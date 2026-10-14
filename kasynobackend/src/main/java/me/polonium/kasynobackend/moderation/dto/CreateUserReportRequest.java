package me.polonium.kasynobackend.moderation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserReportRequest(@NotNull Long targetUserId,
                                      @NotBlank @Size(max = 500) String reason) { }
