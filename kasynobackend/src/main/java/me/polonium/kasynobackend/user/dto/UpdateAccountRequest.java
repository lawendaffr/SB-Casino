package me.polonium.kasynobackend.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateAccountRequest(@Size(min = 3, max = 50) String username,
                                   @Email @Size(max = 254) String email,
                                   String currentPassword,
                                   @Size(min = 8, max = 100) String newPassword) { }
