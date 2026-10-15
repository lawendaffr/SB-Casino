package me.polonium.kasynobackend.repository;

public interface GameStatisticsProjection {
    long getGamesPlayed();
    long getWins();
    long getPushes();
    long getTotalBet();
    long getTotalPayout();
    long getNetResult();
}
