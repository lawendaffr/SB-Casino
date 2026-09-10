package me.polonium.kasynobackend.auth.dto;

public record UserResponse(
        Long id,
        String username,
        long balance
) {
}