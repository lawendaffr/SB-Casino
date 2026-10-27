package me.polonium.kasynobackend.games.blackjack;

import me.polonium.kasynobackend.balance.BalanceService;
import me.polonium.kasynobackend.entity.BlackjackGame;
import me.polonium.kasynobackend.entity.BlackjackStatus;
import me.polonium.kasynobackend.entity.GameRecord;
import me.polonium.kasynobackend.games.GameOperations;
import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.games.blackjack.dto.BlackjackAction;
import me.polonium.kasynobackend.games.blackjack.dto.BlackjackGameResponse;
import me.polonium.kasynobackend.repository.BlackjackGameRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class BlackjackService {

    private static final long MAX_BET = 1_000_000L;

    private static final List<String> RANKS = List.of(
            "A", "2", "3", "4", "5", "6", "7",
            "8", "9", "10", "J", "Q", "K"
    );

    private static final List<String> SUITS = List.of(
            "SPADES", "HEARTS", "DIAMONDS", "CLUBS"
    );

    private final BlackjackGameRepository gameRepository;
    private final BalanceService balanceService;
    private final GameOperations gameOperations;
    private final SecureRandom random = new SecureRandom();

    public BlackjackService(
            BlackjackGameRepository gameRepository,
            BalanceService balanceService,
            GameOperations gameOperations
    ) {
        this.gameRepository = gameRepository;
        this.balanceService = balanceService;
        this.gameOperations = gameOperations;
    }

    @Transactional
    public BlackjackGameResponse start(Long userId, long bet) {
        if (gameRepository.existsByUserIdAndStatus(userId, BlackjackStatus.ACTIVE)) {
            throw activeRoundConflict();
        }

        GameRecord record = gameOperations.start(userId, "BLACKJACK", bet, MAX_BET);

        // GameOperations.start debits under a user row lock. Checking after that
        // lock serializes simultaneous starts for the same player.
        if (gameRepository.existsByUserIdAndStatus(userId, BlackjackStatus.ACTIVE)) {
            throw activeRoundConflict();
        }

        List<String> deck = createDeck();
        Collections.shuffle(deck, random);

        List<String> playerCards = new ArrayList<>();
        List<String> dealerCards = new ArrayList<>();

        playerCards.add(draw(deck));
        dealerCards.add(draw(deck));
        playerCards.add(draw(deck));
        dealerCards.add(draw(deck));

        BlackjackGame game = new BlackjackGame();
        game.setUser(record.getUser());
        game.setGameRecord(record);
        game.setBet(bet);
        game.setStatus(BlackjackStatus.ACTIVE);
        game.setPlayerCards(encode(playerCards));
        game.setDealerCards(encode(dealerCards));
        game.setRemainingDeck(encode(deck));
        game.setPayout(0);
        game.setResult("IN_PROGRESS");

        if (isBlackjack(playerCards)) {
            if (isBlackjack(dealerCards)) {
                finish(game, "PUSH", bet);
            } else {
                finish(game, "PLAYER_BLACKJACK", bet * 5 / 2);
            }
        } else if (isBlackjack(dealerCards)) {
            finish(game, "DEALER_BLACKJACK", 0);
        }

        gameRepository.saveAndFlush(game);

        return toResponse(game, userId);
    }

    private ResponseStatusException activeRoundConflict() {
        return new ResponseStatusException(HttpStatus.CONFLICT,
                "Finish your active Blackjack game before starting another");
    }

    @Transactional(readOnly = true)
    public BlackjackGameResponse getActive(Long userId) {
        BlackjackGame game = gameRepository
                .findFirstByUserIdAndStatusOrderByIdDesc(userId, BlackjackStatus.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No active Blackjack game"
                ));
        return toResponse(game, userId);
    }

    @Transactional
    public BlackjackGameResponse act(
            Long userId,
            Long gameId,
            BlackjackAction action
    ) {
        if (action == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Action is required"
            );
        }

        BlackjackGame game = gameRepository
                .findByIdAndUserIdForUpdate(gameId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Game not found"
                ));

        if (game.getStatus() != BlackjackStatus.ACTIVE) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "This game has already finished"
            );
        }

        List<String> playerCards = decode(game.getPlayerCards());
        List<String> dealerCards = decode(game.getDealerCards());
        List<String> deck = decode(game.getRemainingDeck());

        if (action == BlackjackAction.HIT) {
            playerCards.add(draw(deck));

            if (handTotal(playerCards) > 21) {
                finish(game, "PLAYER_BUST", 0);
            } else if (handTotal(playerCards) == 21) {
                playDealer(game, playerCards, dealerCards, deck);
            }
        } else {
            playDealer(game, playerCards, dealerCards, deck);
        }

        game.setPlayerCards(encode(playerCards));
        game.setDealerCards(encode(dealerCards));
        game.setRemainingDeck(encode(deck));

        return toResponse(game, userId);
    }

    private void playDealer(
            BlackjackGame game,
            List<String> playerCards,
            List<String> dealerCards,
            List<String> deck
    ) {
        while (handTotal(dealerCards) < 17) {
            dealerCards.add(draw(deck));
        }

        int playerTotal = handTotal(playerCards);
        int dealerTotal = handTotal(dealerCards);

        if (dealerTotal > 21 || playerTotal > dealerTotal) {
            finish(game, "PLAYER_WIN", game.getBet() * 2);
        } else if (playerTotal == dealerTotal) {
            finish(game, "PUSH", game.getBet());
        } else {
            finish(game, "DEALER_WIN", 0);
        }
    }

    private void finish(
            BlackjackGame game,
            String result,
            long payout
    ) {
        game.setStatus(BlackjackStatus.FINISHED);
        game.setResult(result);
        game.setPayout(payout);
        game.setFinishedAt(java.time.LocalDateTime.now());
        if (game.getGameRecord() != null) {
            gameOperations.settle(game.getGameRecord(), result, payout);
        }
    }

    private List<String> createDeck() {
        List<String> deck = new ArrayList<>();

        for (String suit : SUITS) {
            for (String rank : RANKS) {
                deck.add(rank + "-" + suit);
            }
        }

        return deck;
    }

    private String draw(List<String> deck) {
        if (deck.isEmpty()) {
            throw new IllegalStateException("The deck is empty");
        }

        return deck.remove(deck.size() - 1);
    }

    private int handTotal(List<String> cards) {
        int total = 0;
        int aces = 0;

        for (String card : cards) {
            String rank = card.substring(0, card.indexOf('-'));

            if (rank.equals("A")) {
                total += 11;
                aces++;
            } else if (
                    rank.equals("K")
                            || rank.equals("Q")
                            || rank.equals("J")
            ) {
                total += 10;
            } else {
                total += Integer.parseInt(rank);
            }
        }

        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }

        return total;
    }

    private boolean isBlackjack(List<String> cards) {
        return cards.size() == 2 && handTotal(cards) == 21;
    }

    private String encode(List<String> cards) {
        return String.join(",", cards);
    }

    private List<String> decode(String cards) {
        if (cards == null || cards.isEmpty()) {
            return new ArrayList<>();
        }

        return new ArrayList<>(Arrays.asList(cards.split(",")));
    }

    private BlackjackGameResponse toResponse(
            BlackjackGame game,
            Long userId
    ) {
        List<String> playerCards = decode(game.getPlayerCards());
        List<String> dealerCards = decode(game.getDealerCards());

        boolean active = game.getStatus() == BlackjackStatus.ACTIVE;

        List<String> visibleDealerCards = active
                ? List.of(dealerCards.get(0))
                : dealerCards;

        Integer dealerTotal = active
                ? null
                : handTotal(dealerCards);

        return new BlackjackGameResponse(
                game.getId(),
                game.getStatus().name(),
                playerCards,
                visibleDealerCards,
                handTotal(playerCards),
                dealerTotal,
                game.getBet(),
                game.getPayout(),
                game.getResult(),
                balanceService.getBalance(userId)
        );
    }
}
