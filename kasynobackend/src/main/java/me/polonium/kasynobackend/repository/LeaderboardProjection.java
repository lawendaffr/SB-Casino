package me.polonium.kasynobackend.repository;

public interface LeaderboardProjection {
    Long getUserId();
    String getUsername();
    long getGamesPlayed();
    long getNetResult();
}
