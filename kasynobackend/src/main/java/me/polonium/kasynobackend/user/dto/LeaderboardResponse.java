package me.polonium.kasynobackend.user.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public record LeaderboardResponse(List<LeaderboardEntryResponse> entries, int page,
                                  int pageSize, long totalElements, int totalPages) {
    public static LeaderboardResponse from(Page<LeaderboardEntryResponse> page) {
        return new LeaderboardResponse(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
