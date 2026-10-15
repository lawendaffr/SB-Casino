package me.polonium.kasynobackend.games;

import me.polonium.kasynobackend.entity.GameDefinition;
import me.polonium.kasynobackend.repository.GameDefinitionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GameCatalogService {
    private final GameDefinitionRepository repository;

    public GameCatalogService(GameDefinitionRepository repository) { this.repository = repository; }

    public GameDefinition requireEnabled(String gameType) {
        GameDefinition game = repository.findById(gameType)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game is not configured"));
        if (!game.isEnabled()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Game is disabled");
        return game;
    }
}
