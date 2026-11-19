package me.polonium.kasynobackend.admin;

import jakarta.validation.Valid;
import me.polonium.kasynobackend.admin.dto.AdminCreateUserRequest;
import me.polonium.kasynobackend.admin.dto.AdminPasswordUpdateRequest;
import me.polonium.kasynobackend.admin.dto.AdminUserResponse;
import me.polonium.kasynobackend.admin.dto.BalanceAdjustmentRequest;
import me.polonium.kasynobackend.admin.dto.RoleUpdateRequest;
import me.polonium.kasynobackend.balance.BalanceService;
import me.polonium.kasynobackend.entity.NotificationCategory;
import me.polonium.kasynobackend.entity.Transaction;
import me.polonium.kasynobackend.entity.TransactionType;
import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.entity.UserRole;
import me.polonium.kasynobackend.notification.NotificationService;
import me.polonium.kasynobackend.repository.RefreshTokenRepository;
import me.polonium.kasynobackend.repository.TransactionRepository;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final UserRepository userRepository;
    private final BalanceService balanceService;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;

    public AdminUserController(UserRepository userRepository, BalanceService balanceService,
                               AuditLogService auditLogService, PasswordEncoder passwordEncoder,
                               RefreshTokenRepository refreshTokenRepository,
                               TransactionRepository transactionRepository,
                               NotificationService notificationService) {
        this.userRepository = userRepository;
        this.balanceService = balanceService;
        this.auditLogService = auditLogService;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenRepository = refreshTokenRepository;
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
    }

    @GetMapping
    public AdminUserPage list(@RequestParam(defaultValue = "0") int page,
                              @RequestParam(defaultValue = "20") int size,
                              @RequestParam(required = false) String q) {
        validatePage(page, size);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Order.asc("id")));
        var users = (q == null || q.isBlank()
                ? userRepository.findAll(pageable)
                : userRepository.findByUsernameContainingIgnoreCase(q.trim(), pageable))
                .map(AdminUserResponse::from);
        return AdminUserPage.from(users);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public AdminUserResponse createUser(@Valid @RequestBody AdminCreateUserRequest request,
                                        Authentication authentication) {
        String username = request.username().trim();
        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already in use");
        }
        String email = (request.email() == null || request.email().isBlank()) ? null : request.email().trim();
        if (email != null && userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use");
        }
        UserRole role = request.role() == null ? UserRole.ADMIN : request.role();
        long initialBalance = request.balance() == null ? 1000L : request.balance();

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(role);
        user.setBalance(initialBalance);
        User saved = userRepository.save(user);

        if (initialBalance > 0) {
            Transaction tx = new Transaction();
            tx.setUser(saved);
            tx.setType(TransactionType.ADMIN_ADJUSTMENT);
            tx.setAmount(initialBalance);
            tx.setBalanceBefore(0);
            tx.setBalanceAfter(initialBalance);
            tx.setDescription("Initial balance set by admin");
            tx.setCreatedAt(LocalDateTime.now());
            transactionRepository.save(tx);
        }

        auditLogService.record((Long) authentication.getPrincipal(), "USER_CREATED", "USER",
                saved.getId().toString(),
                "username=" + saved.getUsername() + "; role=" + saved.getRole() + "; balance=" + saved.getBalance());
        return AdminUserResponse.from(saved);
    }

    @PatchMapping("/{userId}/balance")
    @Transactional
    public AdminUserResponse adjustBalance(@PathVariable Long userId,
                                           @Valid @RequestBody BalanceAdjustmentRequest request,
                                           Authentication authentication) {
        Long actorId = (Long) authentication.getPrincipal();
        var actor = userRepository.findById(actorId).orElse(null);
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        String reason = request.reason() == null || request.reason().isBlank()
                ? "Admin balance adjustment"
                : request.reason().trim();
        long newBalance = balanceService.adjustBalance(userId, request.amount(), reason);
        user.setBalance(newBalance);
        userRepository.saveAndFlush(user);
        auditLogService.record(actorId, "BALANCE_ADJUSTMENT", "USER",
                userId.toString(), "amount=" + request.amount() + "; reason=" + reason);
        notificationService.create(
                userId,
                actor != null ? actor.getUsername() : "Admin",
                NotificationCategory.BALANCE,
                request.amount() > 0 ? "Credits Added by Admin" : "Credits Deducted by Admin",
                (request.amount() > 0 ? "+" : "") + request.amount() + " credits (" + reason + "). New balance: " + newBalance + " credits."
        );
        return AdminUserResponse.from(user);
    }

    @PatchMapping("/{userId}/role")
    @Transactional
    public AdminUserResponse updateRole(@PathVariable Long userId,
                                        @Valid @RequestBody RoleUpdateRequest request,
                                        Authentication authentication) {
        var user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getRole() == UserRole.ADMIN && request.role() != UserRole.ADMIN
                && userRepository.findAllByRoleForUpdate(UserRole.ADMIN).size() <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The last admin role cannot be removed");
        }
        user.setRole(request.role());
        userRepository.save(user);
        auditLogService.record((Long) authentication.getPrincipal(), "ROLE_CHANGED", "USER",
                userId.toString(), "newRole=" + request.role());
        return AdminUserResponse.from(user);
    }

    @PatchMapping("/{userId}/password")
    @Transactional
    public AdminUserResponse updatePassword(@PathVariable Long userId,
                                            @Valid @RequestBody AdminPasswordUpdateRequest request,
                                            Authentication authentication) {
        var user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        refreshTokenRepository.deleteByUserId(userId);
        auditLogService.record((Long) authentication.getPrincipal(), "PASSWORD_RESET", "USER",
                userId.toString(), "Password changed by admin");
        return AdminUserResponse.from(user);
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Page must be non-negative and size must be between 1 and 100");
        }
    }

    public record AdminUserPage(java.util.List<AdminUserResponse> users, int page,
                                int pageSize, long totalElements, int totalPages) {
        public static AdminUserPage from(org.springframework.data.domain.Page<AdminUserResponse> page) {
            return new AdminUserPage(page.getContent(), page.getNumber(), page.getSize(),
                    page.getTotalElements(), page.getTotalPages());
        }
    }
}
