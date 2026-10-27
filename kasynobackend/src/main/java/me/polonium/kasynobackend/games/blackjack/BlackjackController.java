package me.polonium.kasynobackend.games.blackjack;

import me.polonium.kasynobackend.games.blackjack.dto.BlackjackActionRequest;
import me.polonium.kasynobackend.games.blackjack.dto.BlackjackGameResponse;
import me.polonium.kasynobackend.games.blackjack.dto.BlackjackStartRequest;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/games/blackjack")
public class BlackjackController {

    private final BlackjackService blackjackService;

    public BlackjackController(BlackjackService blackjackService) {
        this.blackjackService = blackjackService;
    }

    @PostMapping("/start")
    public BlackjackGameResponse start(
            @RequestBody BlackjackStartRequest request,
            Authentication authentication
    ) {
        Long userId = (Long) authentication.getPrincipal();

        return blackjackService.start(userId, request.bet());
    }

    @GetMapping("/active")
    public BlackjackGameResponse getActive(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return blackjackService.getActive(userId);
    }

    @PostMapping("/{gameId}/action")
    public BlackjackGameResponse act(
            @PathVariable Long gameId,
            @RequestBody BlackjackActionRequest request,
            Authentication authentication
    ) {
        Long userId = (Long) authentication.getPrincipal();

        return blackjackService.act(
                userId,
                gameId,
                request.action()
        );
    }
}
