package me.polonium.kasynobackend.depositcode.dto;

import me.polonium.kasynobackend.entity.RedemptionPolicy;
import java.time.LocalDateTime;

public record DepositCodeResponse(
        String code,
        long amount,
        RedemptionPolicy redemptionPolicy,
        Long maxUses,
        LocalDateTime expiresAt,
        boolean active,
        LocalDateTime createdAt
) {
}