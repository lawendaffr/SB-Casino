package me.polonium.kasynobackend.admin.dto;

public record AdminReportResponse(long users, long activeGames, long completedGames,
                                  long totalBets, long totalPayouts, long netResult) { }
