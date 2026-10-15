package me.polonium.kasynobackend.depositcode;

import me.polonium.kasynobackend.depositcode.dto.RedeemCodeRequest;
import me.polonium.kasynobackend.depositcode.dto.RedeemCodeResponse;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/codes")
public class DepositCodeController {

    private final DepositCodeService depositCodeService;

    public DepositCodeController(DepositCodeService depositCodeService) {
        this.depositCodeService = depositCodeService;
    }

    @PostMapping("/redeem")
    public RedeemCodeResponse redeem(
            Authentication authentication,
            @RequestBody RedeemCodeRequest request
    ) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof Long userId)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Request body is required"
            );
        }

        return depositCodeService.redeemCode(userId, request.code());
    }
}