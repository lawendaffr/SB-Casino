package me.polonium.kasynobackend.user.dto;

import me.polonium.kasynobackend.repository.LeaderboardProjection;

public record LeaderboardEntryResponse(Long userId, String username, long gamesPlayed, long netResult) {
    public static LeaderboardEntryResponse from(LeaderboardProjection entry) {
        return new LeaderboardEntryResponse(entry.getUserId(), entry.getUsername(),
                entry.getGamesPlayed(), entry.getNetResult());
    }
}
