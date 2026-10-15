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
import me.polonium.kasynobackend.depositcode.DepositCodeService;
import me.polonium.kasynobackend.depositcode.dto.CreateDepositCodeRequest;
import me.polonium.kasynobackend.depositcode.dto.DepositCodeResponse;
import me.polonium.kasynobackend.entity.RedemptionPolicy;
import org.springframework.web.server.ResponseStatusException;

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

    @Autowired
    private DepositCodeService depositCodeService;

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

    @Test
    void onceTotalCodeCanOnlyBeRedeemedOnce() {
        DepositCodeResponse code = depositCodeService.createCode(
                new CreateDepositCodeRequest(
                        500, RedemptionPolicy.ONCE_TOTAL, null, null
                )
        );

        depositCodeService.redeemCode(userId, code.code());

        assertEquals(1500, balanceService.getBalance(userId));

        assertThrows(
                ResponseStatusException.class,
                () -> depositCodeService.redeemCode(userId, code.code())
        );

        assertEquals(1500, balanceService.getBalance(userId));
    }

    @Test
    void oncePerUserCodeCanBeRedeemedByDifferentUsers() {
        DepositCodeResponse code = depositCodeService.createCode(
                new CreateDepositCodeRequest(
                        500, RedemptionPolicy.ONCE_PER_USER, null, null
                )
        );

        depositCodeService.redeemCode(userId, code.code());

        assertThrows(
                ResponseStatusException.class,
                () -> depositCodeService.redeemCode(userId, code.code())
        );

        User anotherUser = new User();
        anotherUser.setUsername("balance-test-user-2");
        anotherUser.setPasswordHash("test-hash");
        anotherUser.setBalance(1000);
        anotherUser.setRole(UserRole.USER);

        Long anotherUserId = userRepository.save(anotherUser).getId();

        depositCodeService.redeemCode(anotherUserId, code.code());

        assertEquals(1500, balanceService.getBalance(userId));
        assertEquals(1500, balanceService.getBalance(anotherUserId));
    }

    @Test
    void limitedUsesCodeStopsAtMaximum() {
        DepositCodeResponse code = depositCodeService.createCode(
                new CreateDepositCodeRequest(
                        250, RedemptionPolicy.LIMITED_USES, 2L, null
                )
        );

        depositCodeService.redeemCode(userId, code.code());

        User anotherUser = new User();
        anotherUser.setUsername("limited-code-user");
        anotherUser.setPasswordHash("test-hash");
        anotherUser.setBalance(1000);
        anotherUser.setRole(UserRole.USER);

        Long anotherUserId = userRepository.save(anotherUser).getId();

        depositCodeService.redeemCode(anotherUserId, code.code());

        User thirdUser = new User();
        thirdUser.setUsername("limited-code-user-3");
        thirdUser.setPasswordHash("test-hash");
        thirdUser.setBalance(1000);
        thirdUser.setRole(UserRole.USER);

        Long thirdUserId = userRepository.save(thirdUser).getId();

        assertThrows(
                ResponseStatusException.class,
                () -> depositCodeService.redeemCode(thirdUserId, code.code())
        );

        assertEquals(1250, balanceService.getBalance(userId));
        assertEquals(1250, balanceService.getBalance(anotherUserId));
        assertEquals(1000, balanceService.getBalance(thirdUserId));
    }

    @Test
    void failedRedemptionDoesNotCreateExtraTransaction() {
        DepositCodeResponse code = depositCodeService.createCode(
                new CreateDepositCodeRequest(
                        500, RedemptionPolicy.ONCE_PER_USER, null, null
                )
        );

        depositCodeService.redeemCode(userId, code.code());

        assertThrows(
                ResponseStatusException.class,
                () -> depositCodeService.redeemCode(userId, code.code())
        );

        List<Transaction> transactions =
                transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);

        assertEquals(1, transactions.size());
        assertEquals(TransactionType.DEPOSIT, transactions.get(0).getType());
        assertEquals(500, transactions.get(0).getAmount());
        assertEquals(1000, transactions.get(0).getBalanceBefore());
        assertEquals(1500, transactions.get(0).getBalanceAfter());
    }
}