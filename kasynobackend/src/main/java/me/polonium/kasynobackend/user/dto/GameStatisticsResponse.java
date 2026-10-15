package me.polonium.kasynobackend.user.dto;

import me.polonium.kasynobackend.repository.GameStatisticsProjection;

public record GameStatisticsResponse(long gamesPlayed, long wins, long losses, long pushes,
                                     long totalBet, long totalPayout, long netResult) {
    public static GameStatisticsResponse from(GameStatisticsProjection stats) {
        return new GameStatisticsResponse(stats.getGamesPlayed(), stats.getWins(),
                stats.getGamesPlayed() - stats.getWins() - stats.getPushes(), stats.getPushes(),
                stats.getTotalBet(), stats.getTotalPayout(), stats.getNetResult());
    }
}
