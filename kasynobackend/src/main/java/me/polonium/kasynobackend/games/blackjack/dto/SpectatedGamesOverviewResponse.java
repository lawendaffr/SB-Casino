package me.polonium.kasynobackend.games.blackjack.dto;

import java.util.List;

public record SpectatedGamesOverviewResponse(
        List<SpectatedBlackjackGameResponse> activeGames,
        List<SpectatedBlackjackGameResponse> recentGames
) {
}

