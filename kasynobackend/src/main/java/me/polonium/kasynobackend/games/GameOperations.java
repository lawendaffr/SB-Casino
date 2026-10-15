package me.polonium.kasynobackend.games;

import me.polonium.kasynobackend.balance.BalanceService;
import me.polonium.kasynobackend.entity.GameRecord;
import me.polonium.kasynobackend.entity.GameRecordStatus;
import me.polonium.kasynobackend.entity.TransactionType;
import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.repository.GameRecordRepository;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class GameOperations {
    private final BalanceService balanceService;
    private final GameRecordRepository gameRecordRepository;
    private final UserRepository userRepository;
    private final GameCatalogService gameCatalogService;

    public GameOperations(BalanceService balanceService,
                          GameRecordRepository gameRecordRepository,
                          UserRepository userRepository,
                          GameCatalogService gameCatalogService) {
        this.balanceService = balanceService;
        this.gameRecordRepository = gameRecordRepository;
        this.userRepository = userRepository;
        this.gameCatalogService = gameCatalogService;
    }

    public long validateBet(long bet, long maximumBet) {
        if (bet <= 0 || bet > maximumBet) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Bet must be between 1 and " + maximumBet);
        }
        return bet;
    }

    @Transactional
    public GameRecord start(Long userId, String gameType, long bet, long maximumBet) {
        var definition = gameCatalogService.requireEnabled(gameType);
        validateBet(bet, Math.min(maximumBet, definition.getMaxBet()));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        balanceService.subtractBalance(userId, bet, TransactionType.GAME_BET, gameType + " bet");
        GameRecord record = new GameRecord();
        record.setUser(user);
        record.setGameType(gameType);
        record.setStatus(GameRecordStatus.ACTIVE);
        record.setBet(bet);
        record.setPayout(0);
        record.setResult("IN_PROGRESS");
        return gameRecordRepository.saveAndFlush(record);
    }

    @Transactional
    public void settle(GameRecord record, String result, long payout) {
        if (record.getStatus() == GameRecordStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Game record has already been settled");
        }
        if (payout < 0) {
            throw new IllegalArgumentException("Payout cannot be negative");
        }
        record.setStatus(GameRecordStatus.COMPLETED);
        record.setResult(result);
        record.setPayout(payout);
        record.setFinishedAt(LocalDateTime.now());
        if (payout > 0) {
            balanceService.addBalance(record.getUser().getId(), payout, TransactionType.GAME_WIN,
                    record.getGameType() + " payout: " + result);
        }
        gameRecordRepository.save(record);
    }
}
