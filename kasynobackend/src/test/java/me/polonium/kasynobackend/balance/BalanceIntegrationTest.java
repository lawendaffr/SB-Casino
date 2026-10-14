package me.polonium.kasynobackend.balance;

import me.polonium.kasynobackend.entity.Transaction;
import me.polonium.kasynobackend.entity.TransactionType;
import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.entity.UserRole;
import me.polonium.kasynobackend.repository.TransactionRepository;
import me.polonium.kasynobackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BalanceIntegrationTest {

    @Autowired
    private BalanceService balanceService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    private Long userId;

    @BeforeEach
    void setUp() {
        User user = new User();
        user.setUsername("balance-test-user");
        user.setPasswordHash("test-hash");
        user.setBalance(1000);
        user.setRole(UserRole.USER);

        userId = userRepository.save(user).getId();
    }

    @Test
    void subtractingBalanceCreatesTransaction() {
        long balance = balanceService.subtractBalance(
                userId, 100, TransactionType.GAME_BET, "Test bet"
        );

        assertEquals(900, balance);
        assertEquals(900, balanceService.getBalance(userId));

        List<Transaction> transactions =
                transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);

        assertEquals(1, transactions.size());
        assertEquals(100, transactions.get(0).getAmount());
        assertEquals(1000, transactions.get(0).getBalanceBefore());
        assertEquals(900, transactions.get(0).getBalanceAfter());
    }

    @Test
    void cannotSubtractMoreThanBalance() {
        assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> balanceService.subtractBalance(
                        userId, 2000, TransactionType.GAME_BET, "Test bet"
                )
        );

        assertEquals(1000, balanceService.getBalance(userId));
        assertTrue(
                transactionRepository
                        .findByUserIdOrderByCreatedAtDesc(userId)
                        .isEmpty()
        );
    }

    @Test
    void rejectsZeroAmount() {
        assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> balanceService.addBalance(
                        userId, (long) 0, TransactionType.DEPOSIT, "Invalid"
                )
        );
    }

    @Test
    void addingBalanceCreatesTransaction() {
        long balance = balanceService.addBalance(
                userId, 250, TransactionType.GAME_WIN, "Test win"
        );

        assertEquals(1250, balance);

        List<Transaction> transactions =
                transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);

        assertEquals(1, transactions.size());
        assertEquals(TransactionType.GAME_WIN, transactions.get(0).getType());
        assertEquals(250, transactions.get(0).getAmount());
        assertEquals(1000, transactions.get(0).getBalanceBefore());
        assertEquals(1250, transactions.get(0).getBalanceAfter());
    }
}