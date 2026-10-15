package me.polonium.kasynobackend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "game_catalog")
public class GameDefinition {
    @Id
    @Column(name = "game_type", length = 40)
    private String gameType;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "max_bet", nullable = false)
    private long maxBet;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void updateTimestamp() { updatedAt = LocalDateTime.now(); }

    public String getGameType() { return gameType; }
    public void setGameType(String gameType) { this.gameType = gameType; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public long getMaxBet() { return maxBet; }
    public void setMaxBet(long maxBet) { this.maxBet = maxBet; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
