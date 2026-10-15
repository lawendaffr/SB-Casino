package me.polonium.kasynobackend.admin.dto;

import jakarta.validation.constraints.NotNull;
import me.polonium.kasynobackend.entity.UserRole;

public record RoleUpdateRequest(@NotNull UserRole role) { }
