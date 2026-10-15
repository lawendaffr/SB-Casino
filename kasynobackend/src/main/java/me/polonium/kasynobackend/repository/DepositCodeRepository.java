package me.polonium.kasynobackend.repository;

import jakarta.persistence.LockModeType;
import me.polonium.kasynobackend.entity.DepositCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DepositCodeRepository
        extends JpaRepository<DepositCode, Long> {

    boolean existsByCode(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM DepositCode c WHERE c.code = :code")
    Optional<DepositCode> findByCodeForUpdate(
            @Param("code") String code
    );
}