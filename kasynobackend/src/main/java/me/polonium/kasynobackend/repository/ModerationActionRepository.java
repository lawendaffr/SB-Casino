package me.polonium.kasynobackend.repository;

import me.polonium.kasynobackend.entity.ModerationAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModerationActionRepository extends JpaRepository<ModerationAction, Long> {
    Page<ModerationAction> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId, Pageable pageable);
}
