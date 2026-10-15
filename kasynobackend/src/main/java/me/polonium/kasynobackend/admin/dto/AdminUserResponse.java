package me.polonium.kasynobackend.admin.dto;

import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.entity.UserRole;
import me.polonium.kasynobackend.entity.AccountStatus;
import java.time.LocalDateTime;

public record AdminUserResponse(Long id, String username, long balance, UserRole role,
                                AccountStatus accountStatus, LocalDateTime suspendedUntil) {
    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(user.getId(), user.getUsername(), user.getBalance(), user.getRole(),
                user.getAccountStatus(), user.getSuspendedUntil());
    }
}
