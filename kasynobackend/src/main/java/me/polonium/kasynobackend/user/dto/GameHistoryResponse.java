package me.polonium.kasynobackend.user.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public record GameHistoryResponse(
        List<GameRecordResponse> games,
        int page,
        int pageSize,
        long totalElements,
        int totalPages
) {
    public static GameHistoryResponse from(Page<GameRecordResponse> page) {
        return new GameHistoryResponse(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
