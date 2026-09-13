package me.polonium.kasynobackend.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken
) {
}
