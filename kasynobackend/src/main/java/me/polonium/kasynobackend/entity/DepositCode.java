package me.polonium.kasynobackend.entity;


import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "deposit_codes")
public class DepositCode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 32)
    private String code;

    @Column(nullable = false)
    private long amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "redemption_policy", nullable = false, length = 30)
    private RedemptionPolicy redemptionPolicy;

    @Column(name = "max_uses")
    private Long maxUses;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public long getAmount() {
        return amount;
    }

    public void setAmount(long amount) {
        this.amount = amount;
    }

    public RedemptionPolicy getRedemptionPolicy() {
        return redemptionPolicy;
    }

    public void setRedemptionPolicy(RedemptionPolicy redemptionPolicy) {
        this.redemptionPolicy = redemptionPolicy;
    }

    public Long getMaxUses() {
        return maxUses;
    }

    public void setMaxUses(Long maxUses) {
        this.maxUses = maxUses;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
