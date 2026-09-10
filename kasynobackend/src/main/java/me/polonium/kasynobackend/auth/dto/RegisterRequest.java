package me.polonium.kasynobackend.auth.dto;

public record RegisterRequest(
        String username,
        String password
) {
}
