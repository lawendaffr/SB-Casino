package me.polonium.kasynobackend.games;

import me.polonium.kasynobackend.admin.dto.GameDefinitionResponse;
import me.polonium.kasynobackend.repository.GameDefinitionRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/games")
public class GameCatalogController {
    private final GameDefinitionRepository games;
    public GameCatalogController(GameDefinitionRepository games) { this.games = games; }

    @GetMapping
    public List<GameDefinitionResponse> listEnabled() {
        return games.findAll().stream().filter(game -> game.isEnabled())
                .map(GameDefinitionResponse::from).toList();
    }
}
