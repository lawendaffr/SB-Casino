package me.polonium.kasynobackend.admin.dto;

import me.polonium.kasynobackend.entity.GameDefinition;
import java.time.LocalDateTime;

public record GameDefinitionResponse(String gameType, boolean enabled, long maxBet, LocalDateTime updatedAt) {
    public static GameDefinitionResponse from(GameDefinition game) {
        return new GameDefinitionResponse(game.getGameType(), game.isEnabled(), game.getMaxBet(), game.getUpdatedAt());
    }
}
