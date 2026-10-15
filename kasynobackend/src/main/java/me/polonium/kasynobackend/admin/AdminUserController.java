package me.polonium.kasynobackend.admin;

import jakarta.validation.Valid;
import me.polonium.kasynobackend.admin.dto.AdminUserResponse;
import me.polonium.kasynobackend.admin.dto.BalanceAdjustmentRequest;
import me.polonium.kasynobackend.admin.dto.RoleUpdateRequest;
import me.polonium.kasynobackend.balance.BalanceService;
import me.polonium.kasynobackend.entity.UserRole;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final UserRepository userRepository;
    private final BalanceService balanceService;
    private final AuditLogService auditLogService;

    public AdminUserController(UserRepository userRepository, BalanceService balanceService,
                               AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.balanceService = balanceService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public AdminUserPage list(@RequestParam(defaultValue = "0") int page,
                              @RequestParam(defaultValue = "20") int size) {
        validatePage(page, size);
        var users = userRepository.findAll(PageRequest.of(page, size,
                Sort.by(Sort.Order.asc("id")))).map(AdminUserResponse::from);
        return AdminUserPage.from(users);
    }

    @PatchMapping("/{userId}/balance")
    @Transactional
    public AdminUserResponse adjustBalance(@PathVariable Long userId,
                                           @Valid @RequestBody BalanceAdjustmentRequest request,
                                           Authentication authentication) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        balanceService.adjustBalance(userId, request.amount(),
                request.reason() == null || request.reason().isBlank() ? "Admin balance adjustment" : request.reason());
        auditLogService.record((Long) authentication.getPrincipal(), "BALANCE_ADJUSTMENT", "USER",
                userId.toString(), "amount=" + request.amount() + "; reason=" + request.reason());
        return AdminUserResponse.from(userRepository.findById(userId).orElseThrow());
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
