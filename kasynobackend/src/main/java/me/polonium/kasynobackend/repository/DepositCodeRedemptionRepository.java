package me.polonium.kasynobackend.repository;

import me.polonium.kasynobackend.entity.DepositCodeRedemption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepositCodeRedemptionRepository
        extends JpaRepository<DepositCodeRedemption, Long> {

    boolean existsByDepositCode_IdAndUser_Id(
            Long depositCodeId,
            Long userId
    );

    long countByDepositCode_Id(Long depositCodeId);
}