package me.polonium.kasynobackend.repository;

import me.polonium.kasynobackend.entity.GameRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GameRecordRepository extends JpaRepository<GameRecord, Long> {
    Page<GameRecord> findByUserId(Long userId, Pageable pageable);

    @Query("""
        SELECT COUNT(g) AS gamesPlayed,
               COALESCE(SUM(CASE WHEN g.result LIKE '%WIN%' OR g.result = 'PLAYER_BLACKJACK' THEN 1 ELSE 0 END), 0) AS wins,
               COALESCE(SUM(CASE WHEN g.result = 'PUSH' THEN 1 ELSE 0 END), 0) AS pushes,
               COALESCE(SUM(g.bet), 0) AS totalBet,
               COALESCE(SUM(g.payout), 0) AS totalPayout,
               COALESCE(SUM(g.payout - g.bet), 0) AS netResult
        FROM GameRecord g
        WHERE g.user.id = :userId AND g.status = me.polonium.kasynobackend.entity.GameRecordStatus.COMPLETED
        """)
    GameStatisticsProjection getStatistics(@Param("userId") Long userId);

    @Query(value = """
        SELECT u.id AS userId, u.username AS username, COUNT(g.id) AS gamesPlayed,
               COALESCE(SUM(g.payout - g.bet), 0) AS netResult
        FROM users u JOIN game_records g ON g.user_id = u.id
        WHERE g.status = 'COMPLETED'
        GROUP BY u.id, u.username
        ORDER BY netResult DESC, u.id ASC
        """, countQuery = """
        SELECT COUNT(*) FROM (SELECT u.id FROM users u JOIN game_records g ON g.user_id = u.id
        WHERE g.status = 'COMPLETED' GROUP BY u.id) leaderboard
        """, nativeQuery = true)
    Page<LeaderboardProjection> findLeaderboard(Pageable pageable);

    @Query("SELECT COUNT(g) FROM GameRecord g WHERE g.status = me.polonium.kasynobackend.entity.GameRecordStatus.COMPLETED")
    long countCompletedGames();

    @Query("SELECT COUNT(g) FROM GameRecord g WHERE g.status = me.polonium.kasynobackend.entity.GameRecordStatus.ACTIVE")
    long countActiveGames();

    @Query("SELECT COALESCE(SUM(g.bet), 0) FROM GameRecord g WHERE g.status = me.polonium.kasynobackend.entity.GameRecordStatus.COMPLETED")
    long sumCompletedBets();

    @Query("SELECT COALESCE(SUM(g.payout), 0) FROM GameRecord g WHERE g.status = me.polonium.kasynobackend.entity.GameRecordStatus.COMPLETED")
    long sumCompletedPayouts();
}
