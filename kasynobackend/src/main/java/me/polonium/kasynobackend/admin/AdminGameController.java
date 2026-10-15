package me.polonium.kasynobackend.admin;

import jakarta.validation.Valid;
import me.polonium.kasynobackend.admin.dto.GameDefinitionResponse;
import me.polonium.kasynobackend.admin.dto.GameManagementRequest;
import me.polonium.kasynobackend.repository.GameDefinitionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/admin/games")
public class AdminGameController {
    private final GameDefinitionRepository games;
    private final AuditLogService audit;

    public AdminGameController(GameDefinitionRepository games, AuditLogService audit) {
        this.games = games;
        this.audit = audit;
    }

    @GetMapping
    public List<GameDefinitionResponse> list() {
        return games.findAll().stream().map(GameDefinitionResponse::from).toList();
    }

    @PatchMapping("/{gameType}")
    @Transactional
    public GameDefinitionResponse update(@PathVariable String gameType,
                                         @Valid @RequestBody GameManagementRequest request,
                                         Authentication authentication) {
        var game = games.findById(gameType.toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));
        game.setEnabled(request.enabled());
        game.setMaxBet(request.maxBet());
        games.save(game);
        audit.record((Long) authentication.getPrincipal(), "GAME_SETTINGS_CHANGED", "GAME", gameType,
                "enabled=" + request.enabled() + "; maxBet=" + request.maxBet());
        return GameDefinitionResponse.from(game);
    }
}
