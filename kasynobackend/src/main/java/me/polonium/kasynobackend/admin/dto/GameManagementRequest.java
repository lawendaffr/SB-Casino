package me.polonium.kasynobackend.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;

public record GameManagementRequest(@NotNull Boolean enabled, @NotNull @Min(1) @Max(1_000_000) Long maxBet) { }
