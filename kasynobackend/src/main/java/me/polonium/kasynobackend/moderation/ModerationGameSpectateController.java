package me.polonium.kasynobackend.moderation;

import me.polonium.kasynobackend.games.blackjack.BlackjackService;
import me.polonium.kasynobackend.games.blackjack.dto.SpectatedBlackjackGameResponse;
import me.polonium.kasynobackend.games.blackjack.dto.SpectatedGamesOverviewResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/moderation/games")
public class ModerationGameSpectateController {

    private final BlackjackService blackjackService;

    public ModerationGameSpectateController(BlackjackService blackjackService) {
        this.blackjackService = blackjackService;
    }

    @GetMapping("/active")
    public SpectatedGamesOverviewResponse listActiveAndRecent(
            @RequestParam(defaultValue = "12") int recentLimit
    ) {
        return blackjackService.listSpectatedGames(recentLimit);
    }

    @GetMapping("/blackjack/{gameId}")
    public SpectatedBlackjackGameResponse getBlackjackGame(@PathVariable Long gameId) {
        return blackjackService.getSpectatedGame(gameId);
    }

    @GetMapping("/users/{userId}")
    public SpectatedBlackjackGameResponse getLatestUserGame(@PathVariable Long userId) {
        return blackjackService.getSpectatedUserGame(userId);
    }
}

