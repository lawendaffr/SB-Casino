package me.polonium.kasynobackend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "game_records", indexes = {
        @Index(name = "idx_game_records_user_created", columnList = "user_id, created_at DESC")
})
public class GameRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "game_type", nullable = false, length = 40)
    private String gameType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GameRecordStatus status;

    @Column(nullable = false)
    private long bet;

    @Column(nullable = false)
    private long payout;

    @Column(nullable = false, length = 40)
    private String result;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getGameType() { return gameType; }
    public void setGameType(String gameType) { this.gameType = gameType; }
    public GameRecordStatus getStatus() { return status; }
    public void setStatus(GameRecordStatus status) { this.status = status; }
    public long getBet() { return bet; }
    public void setBet(long bet) { this.bet = bet; }
    public long getPayout() { return payout; }
    public void setPayout(long payout) { this.payout = payout; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(LocalDateTime finishedAt) { this.finishedAt = finishedAt; }
}
