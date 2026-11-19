package me.polonium.kasynobackend.repository;

import jakarta.persistence.LockModeType;
import me.polonium.kasynobackend.entity.BlackjackGame;
import me.polonium.kasynobackend.entity.BlackjackStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
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

    @Query("""
        SELECT g FROM BlackjackGame g
        JOIN FETCH g.user
        WHERE g.status = :status
        ORDER BY g.createdAt DESC, g.id DESC
        """)
    List<BlackjackGame> findByStatusWithUser(
            @Param("status") BlackjackStatus status,
            Pageable pageable
    );

    @Query("""
        SELECT g FROM BlackjackGame g
        JOIN FETCH g.user
        WHERE g.id = :gameId
        """)
    Optional<BlackjackGame> findByIdWithUser(@Param("gameId") Long gameId);

    @Query("""
        SELECT g FROM BlackjackGame g
        JOIN FETCH g.user
        WHERE g.user.id = :userId
        ORDER BY CASE WHEN g.status = me.polonium.kasynobackend.entity.BlackjackStatus.ACTIVE THEN 0 ELSE 1 END,
                 g.id DESC
        """)
    List<BlackjackGame> findLatestByUserIdWithUser(
            @Param("userId") Long userId,
            Pageable pageable
    );
}
