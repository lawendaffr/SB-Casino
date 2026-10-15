package me.polonium.kasynobackend.games.blackjack.dto;

import java.util.List;

public record BlackjackGameResponse(
        Long gameId,
        String status,
        List<String> playerCards,
        List<String> dealerCards,
        int playerTotal,
        Integer dealerTotal,
        long bet,
        long payout,
        String result,
        long balance
) {
}