package me.polonium.kasynobackend.depositcode;

import me.polonium.kasynobackend.balance.BalanceService;
import me.polonium.kasynobackend.depositcode.dto.CreateDepositCodeRequest;
import me.polonium.kasynobackend.depositcode.dto.DepositCodeResponse;
import me.polonium.kasynobackend.depositcode.dto.RedeemCodeResponse;
import me.polonium.kasynobackend.entity.DepositCode;
import me.polonium.kasynobackend.entity.DepositCodeRedemption;
import me.polonium.kasynobackend.entity.RedemptionPolicy;
import me.polonium.kasynobackend.entity.TransactionType;
import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.repository.DepositCodeRedemptionRepository;
import me.polonium.kasynobackend.repository.DepositCodeRepository;
import me.polonium.kasynobackend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class DepositCodeService {

    private static final long MAX_AMOUNT = 1_000_000_000L;
    private static final String CHARACTERS =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final DepositCodeRepository codeRepository;
    private final DepositCodeRedemptionRepository redemptionRepository;
    private final UserRepository userRepository;
    private final BalanceService balanceService;
    private final SecureRandom random = new SecureRandom();

    public DepositCodeService(
            DepositCodeRepository codeRepository,
            DepositCodeRedemptionRepository redemptionRepository,
            UserRepository userRepository,
            BalanceService balanceService
    ) {
        this.codeRepository = codeRepository;
        this.redemptionRepository = redemptionRepository;
        this.userRepository = userRepository;
        this.balanceService = balanceService;
    }

    @Transactional
    public DepositCodeResponse createCode(CreateDepositCodeRequest request) {
        if (request == null || request.redemptionPolicy() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Redemption policy is required"
            );
        }

        long amount = request.amount();
        RedemptionPolicy policy = request.redemptionPolicy();
        Long maxUses = request.maxUses();
        LocalDateTime expiresAt = request.expiresAt();

        if (amount <= 0 || amount > MAX_AMOUNT) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Amount must be between 1 and " + MAX_AMOUNT
            );
        }

        if (maxUses != null && maxUses <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Maximum uses must be positive"
            );
        }

        if (expiresAt != null && !expiresAt.isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Expiration must be in the future"
            );
        }

        if (policy == RedemptionPolicy.ONCE_TOTAL) {
            if (maxUses != null && maxUses != 1) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "ONCE_TOTAL must have a maximum of one use"
                );
            }
            maxUses = 1L;
        }

        if (policy == RedemptionPolicy.LIMITED_USES && maxUses == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "LIMITED_USES requires maxUses"
            );
        }

        DepositCode code = new DepositCode();
        code.setCode(generateUniqueCode());
        code.setAmount(amount);
        code.setRedemptionPolicy(policy);
        code.setMaxUses(maxUses);
        code.setExpiresAt(expiresAt);
        code.setActive(true);

        return toResponse(codeRepository.save(code));
    }

    @Transactional
    public RedeemCodeResponse redeemCode(Long userId, String rawCode) {
        if (rawCode == null || rawCode.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Code is required"
            );
        }

        String codeValue = rawCode.trim().toUpperCase(Locale.ROOT);

        DepositCode code = codeRepository.findByCodeForUpdate(codeValue)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Invalid deposit code"
                ));

        if (!code.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This code is inactive"
            );
        }

        if (code.getExpiresAt() != null
                && !code.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This code has expired"
            );
        }

        long uses = redemptionRepository.countByDepositCode_Id(code.getId());

        if (code.getMaxUses() != null && uses >= code.getMaxUses()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This code has reached its redemption limit"
            );
        }

        if (redemptionRepository.existsByDepositCode_IdAndUser_Id(
                code.getId(), userId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You have already redeemed this code"
            );
        }

        if (code.getRedemptionPolicy() == RedemptionPolicy.ONCE_TOTAL
                && uses >= 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This code has already been redeemed"
            );
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        DepositCodeRedemption redemption = new DepositCodeRedemption();
        redemption.setDepositCode(code);
        redemption.setUser(user);

        redemptionRepository.saveAndFlush(redemption);

        long newBalance = balanceService.addBalance(
                userId,
                code.getAmount(),
                TransactionType.DEPOSIT,
                "Deposit code: " + codeValue
        );

        return new RedeemCodeResponse(
                codeValue,
                code.getAmount(),
                newBalance
        );
    }

    @Transactional
    public DepositCodeResponse deactivateCode(String rawCode) {
        if (rawCode == null || rawCode.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Code is required"
            );
        }

        String codeValue = rawCode.trim().toUpperCase(Locale.ROOT);

        DepositCode code = codeRepository.findByCodeForUpdate(codeValue)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Deposit code not found"
                ));

        code.setActive(false);
        return toResponse(code);
    }

    @Transactional(readOnly = true)
    public Page<DepositCodeResponse> listCodes(Pageable pageable) {
        return codeRepository.findAll(pageable).map(this::toResponse);
    }

    private DepositCodeResponse toResponse(DepositCode code) {
        return new DepositCodeResponse(
                code.getCode(),
                code.getAmount(),
                code.getRedemptionPolicy(),
                code.getMaxUses(),
                code.getExpiresAt(),
                code.isActive(),
                code.getCreatedAt()
        );
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder value = new StringBuilder("CAS-");

            for (int i = 0; i < 16; i++) {
                value.append(CHARACTERS.charAt(
                        random.nextInt(CHARACTERS.length())
                ));
            }

            String code = value.toString();

            if (!codeRepository.existsByCode(code)) {
                return code;
            }
        }

        throw new IllegalStateException(
                "Could not generate a unique deposit code"
        );
    }
}
