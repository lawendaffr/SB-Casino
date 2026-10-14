package me.polonium.kasynobackend.user.dto;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(@NotBlank String currentPassword) { }
