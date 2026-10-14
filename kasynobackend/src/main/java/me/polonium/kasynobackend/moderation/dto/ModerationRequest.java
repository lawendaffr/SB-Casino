package me.polonium.kasynobackend.moderation.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ModerationRequest(@NotBlank @Size(max = 500) String reason,
                                @Min(1) @Max(720) Integer hours) { }
