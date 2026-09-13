package me.polonium.kasynobackend.auth.dto;

import me.polonium.kasynobackend.entity.User;

public record RefreshResult(
        User user,
        String refreshToken
) {}