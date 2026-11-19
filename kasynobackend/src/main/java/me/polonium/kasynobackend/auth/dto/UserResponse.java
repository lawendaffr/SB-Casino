package me.polonium.kasynobackend.auth.dto;

import me.polonium.kasynobackend.entity.UserRole;

public record UserResponse(
        Long id,
        String username,
        long balance,
        UserRole role
) {
    public UserResponse(Long id, String username, long balance) {
        this(id, username, balance, UserRole.USER);
    }
}