package me.polonium.kasynobackend.repository;

import jakarta.persistence.LockModeType;
import me.polonium.kasynobackend.entity.BlackjackGame;
import me.polonium.kasynobackend.entity.BlackjackStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BlackjackGameRepository
        extends JpaRepository<BlackjackGame, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT g FROM BlackjackGame g
        WHERE g.id = :gameId AND g.user.id = :userId
        """)
    Optional<BlackjackGame> findByIdAndUserIdForUpdate(
            @Param("gameId") Long gameId,
            @Param("userId") Long userId
    );

    boolean existsByUserIdAndStatus(Long userId, BlackjackStatus status);

    Optional<BlackjackGame> findFirstByUserIdAndStatusOrderByIdDesc(Long userId,
                                                                    BlackjackStatus status);
}
