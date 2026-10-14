package me.polonium.kasynobackend.balance;

import jakarta.transaction.Transactional;
import me.polonium.kasynobackend.balance.dto.TransactionResponse;
import me.polonium.kasynobackend.entity.Transaction;
import me.polonium.kasynobackend.entity.TransactionType;
import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.repository.TransactionRepository;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class BalanceService {
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    public BalanceService(UserRepository userRepository, TransactionRepository transactionRepository) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }
    @Transactional
    public long addBalance(
            long userId,
            long amount,
            TransactionType type,
            String description
    ) {
        validateAmount(amount);
        User user = getUserForUpdate(userId);
        long balanceBefore = user.getBalance();
        long balanceAfter = balanceBefore + amount;
        user.setBalance(balanceAfter);

        saveTransaction(
                user,
                type,
                amount,
                balanceBefore,
                balanceAfter,
                description
        );
        return balanceAfter;
    }

    @Transactional
    public long subtractBalance(
            long userId,
            long amount,
            TransactionType type,
            String description
    ) {
        validateAmount(amount);

        User user = getUserForUpdate(userId);

        long balanceBefore = user.getBalance();

        if (balanceBefore < amount) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Insufficient balance"
            );
        }

        long balanceAfter = balanceBefore - amount;

        user.setBalance(balanceAfter);

        saveTransaction(
                user,
                type,
                amount,
                balanceBefore,
                balanceAfter,
                description
        );

        return balanceAfter;
    }

    @Transactional
    public long getBalance(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found"
                        )
                );

        return user.getBalance();
    }

    private User getUserForUpdate(Long userId) {
        return userRepository.findByIdForUpdate(userId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found"
                        )
                );
    }
    private void saveTransaction(
            User user,
            TransactionType type,
            long amount,
            long balanceBefore,
            long balanceAfter,
            String description
    ) {
        Transaction transaction = new Transaction();

        transaction.setUser(user);
        transaction.setType(type);
        transaction.setAmount(amount);
        transaction.setBalanceBefore(balanceBefore);
        transaction.setBalanceAfter(balanceAfter);
        transaction.setDescription(description);
        transaction.setCreatedAt(java.time.LocalDateTime.now());

        transactionRepository.save(transaction);
    }

    private void validateAmount(long amount) {
        if (amount <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Amount must be greater than zero"
            );
        }
    }

    public List<TransactionResponse> getTransactions(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "User not found"
            );
        }

        return transactionRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(transaction -> new TransactionResponse(
                        transaction.getId(),
                        transaction.getType(),
                        transaction.getAmount(),
                        transaction.getBalanceBefore(),
                        transaction.getBalanceAfter(),
                        transaction.getDescription(),
                        transaction.getCreatedAt()
                ))
                .toList();
    }
}
