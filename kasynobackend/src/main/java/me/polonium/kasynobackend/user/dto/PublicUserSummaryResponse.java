package me.polonium.kasynobackend.user.dto;

import me.polonium.kasynobackend.entity.User;

public record PublicUserSummaryResponse(Long id, String username) {
    public static PublicUserSummaryResponse from(User user) {
        return new PublicUserSummaryResponse(user.getId(), user.getUsername());
    }
}
