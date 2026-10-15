package me.polonium.kasynobackend.depositcode.dto;

public record RedeemCodeResponse(
        String code,
        long amount,
        long balance
) {
}