package me.polonium.kasynobackend.games.blackjack.dto;

import java.time.LocalDateTime;
import java.util.List;

public record SpectatedBlackjackGameResponse(
        Long gameId,
        String gameType,
        Long userId,
        String username,
        long playerBalance,
        String status,
        List<String> playerCards,
        int playerTotal,
        List<String> dealerVisibleCards,
        List<String> dealerAllCards,
        Integer dealerVisibleTotal,
        int dealerActualTotal,
        int remainingDeckCount,
        long bet,
        long payout,
        String result,
        LocalDateTime createdAt,
        LocalDateTime finishedAt
) {
}

