package me.polonium.kasynobackend.depositcode.dto;

import me.polonium.kasynobackend.entity.RedemptionPolicy;

import java.time.LocalDateTime;

public record CreateDepositCodeRequest(
        long amount,
        RedemptionPolicy redemptionPolicy,
        Long maxUses,
        LocalDateTime expiresAt
) {
}
