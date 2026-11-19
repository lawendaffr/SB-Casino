package me.polonium.kasynobackend.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import me.polonium.kasynobackend.entity.UserRole;

public record AdminCreateUserRequest(
        @NotBlank @Size(min = 3, max = 50) String username,
        @NotBlank @Size(min = 8, max = 100) String password,
        @Email @Size(max = 254) String email,
        UserRole role,
        @Min(0) Long balance
) { }

