package me.polonium.kasynobackend.config;

import me.polonium.kasynobackend.entity.AccountStatus;
import me.polonium.kasynobackend.entity.Transaction;
import me.polonium.kasynobackend.entity.TransactionType;
import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.entity.UserRole;
import me.polonium.kasynobackend.repository.TransactionRepository;
import me.polonium.kasynobackend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@Profile("!test")
public class TempAdminInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(TempAdminInitializer.class);

    public static final String TEMP_ADMIN_USERNAME = "admin";
    public static final String TEMP_ADMIN_PASSWORD = "admin123";
    public static final long TEMP_ADMIN_BALANCE = 10_000L;

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    public TempAdminInitializer(
            UserRepository userRepository,
            TransactionRepository transactionRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        var existing = userRepository.findByUsername(TEMP_ADMIN_USERNAME);
        if (existing.isPresent()) {
            User admin = existing.get();
            if (admin.getRole() != UserRole.ADMIN) {
                admin.setRole(UserRole.ADMIN);
                userRepository.save(admin);
                log.info("Promoted existing '{}' account to ADMIN role.", TEMP_ADMIN_USERNAME);
            }
            return;
        }

        User admin = new User();
        admin.setUsername(TEMP_ADMIN_USERNAME);
        if (!userRepository.existsByEmailIgnoreCase("admin@sbcasino.local")) {
            admin.setEmail("admin@sbcasino.local");
        }
        admin.setPasswordHash(passwordEncoder.encode(TEMP_ADMIN_PASSWORD));
        admin.setRole(UserRole.ADMIN);
        admin.setAccountStatus(AccountStatus.ACTIVE);
        admin.setBalance(TEMP_ADMIN_BALANCE);

        User saved = userRepository.save(admin);

        Transaction transaction = new Transaction();
        transaction.setUser(saved);
        transaction.setType(TransactionType.DEPOSIT);
        transaction.setAmount(TEMP_ADMIN_BALANCE);
        transaction.setBalanceBefore(0);
        transaction.setBalanceAfter(TEMP_ADMIN_BALANCE);
        transaction.setDescription("Temporary admin initial credits");
        transaction.setCreatedAt(LocalDateTime.now());
        transactionRepository.save(transaction);

        log.info("Seeded temporary admin account '{}' with role ADMIN.", TEMP_ADMIN_USERNAME);
    }
}

