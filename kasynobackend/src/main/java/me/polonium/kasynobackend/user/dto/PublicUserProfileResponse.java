package me.polonium.kasynobackend.user.dto;

public record PublicUserProfileResponse(Long id, String username, long gamesPlayed,
                                        long wins, long netResult) { }
