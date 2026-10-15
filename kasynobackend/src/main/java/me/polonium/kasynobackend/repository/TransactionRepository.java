package me.polonium.kasynobackend.repository;

import me.polonium.kasynobackend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction,Long> {
    List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId);
}
