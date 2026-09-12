package me.polonium.kasynobackend.auth.dto;

public record LoginRequest(
        String username,
        String password
) {
}
