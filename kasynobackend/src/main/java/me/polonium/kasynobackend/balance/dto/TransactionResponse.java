package me.polonium.kasynobackend.balance.dto;

import me.polonium.kasynobackend.entity.TransactionType;

import java.time.LocalDateTime;

public record TransactionResponse(
        Long id,
        TransactionType type,
        long amount,
        long balanceBefore,
        long balanceAfter,
        String description,
        LocalDateTime createdAt
) {}