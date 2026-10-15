package me.polonium.kasynobackend.admin.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BalanceAdjustmentRequest(@NotNull Long amount, @Size(max = 200) String reason) { }
