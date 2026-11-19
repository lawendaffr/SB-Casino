package me.polonium.kasynobackend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminPasswordUpdateRequest(
        @NotBlank @Size(min = 8, max = 100) String newPassword
) { }

