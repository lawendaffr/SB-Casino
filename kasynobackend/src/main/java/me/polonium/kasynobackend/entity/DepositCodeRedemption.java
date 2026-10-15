package me.polonium.kasynobackend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "deposit_code_redemptions",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_code_redemption",
                columnNames = {"deposit_code_id", "user_id"}
        )
)
public class DepositCodeRedemption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "deposit_code_id", nullable = false)
    private DepositCode depositCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "redeemed_at", nullable = false)
    private LocalDateTime redeemedAt;

    @PrePersist
    void onCreate() {
        if (redeemedAt == null) {
            redeemedAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public DepositCode getDepositCode() {
        return depositCode;
    }

    public void setDepositCode(DepositCode depositCode) {
        this.depositCode = depositCode;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getRedeemedAt() {
        return redeemedAt;
    }
}