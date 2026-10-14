package me.polonium.kasynobackend.user.dto;

import me.polonium.kasynobackend.entity.GameRecord;
import me.polonium.kasynobackend.entity.GameRecordStatus;

import java.time.LocalDateTime;

public record GameRecordResponse(
        Long id,
        String gameType,
        GameRecordStatus status,
        long bet,
        long payout,
        Long netResult,
        String result,
        LocalDateTime createdAt,
        LocalDateTime finishedAt
) {
    public static GameRecordResponse from(GameRecord game) {
        Long netResult = game.getStatus() == GameRecordStatus.COMPLETED
                ? game.getPayout() - game.getBet()
                : null;
        return new GameRecordResponse(game.getId(), game.getGameType(), game.getStatus(),
                game.getBet(), game.getPayout(), netResult, game.getResult(),
                game.getCreatedAt(), game.getFinishedAt());
    }
}
