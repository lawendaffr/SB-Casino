package me.polonium.kasynobackend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blackjack_games")
public class BlackjackGame {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_record_id", unique = true)
    private GameRecord gameRecord;

    @Column(nullable = false)
    private long bet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BlackjackStatus status;

    @Column(name = "player_cards", nullable = false, columnDefinition = "TEXT")
    private String playerCards;

    @Column(name = "dealer_cards", nullable = false, columnDefinition = "TEXT")
    private String dealerCards;

    @Column(name = "remaining_deck", nullable = false, columnDefinition = "TEXT")
    private String remainingDeck;

    @Column(nullable = false)
    private long payout = 0;

    @Column(nullable = false)
    private String result = "IN_PROGRESS";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public GameRecord getGameRecord() { return gameRecord; }
    public void setGameRecord(GameRecord gameRecord) { this.gameRecord = gameRecord; }

    public long getBet() {
        return bet;
    }

    public void setBet(long bet) {
        this.bet = bet;
    }

    public BlackjackStatus getStatus() {
        return status;
    }

    public void setStatus(BlackjackStatus status) {
        this.status = status;
    }

    public String getPlayerCards() {
        return playerCards;
    }

    public void setPlayerCards(String playerCards) {
        this.playerCards = playerCards;
    }

    public String getDealerCards() {
        return dealerCards;
    }

    public void setDealerCards(String dealerCards) {
        this.dealerCards = dealerCards;
    }

    public String getRemainingDeck() {
        return remainingDeck;
    }

    public void setRemainingDeck(String remainingDeck) {
        this.remainingDeck = remainingDeck;
    }

    public long getPayout() {
        return payout;
    }

    public void setPayout(long payout) {
        this.payout = payout;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(LocalDateTime finishedAt) {
        this.finishedAt = finishedAt;
    }
}
