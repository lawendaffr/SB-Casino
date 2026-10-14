package me.polonium.kasynobackend.user;

import me.polonium.kasynobackend.auth.dto.UserResponse;
import me.polonium.kasynobackend.balance.BalanceService;
import me.polonium.kasynobackend.balance.dto.BalanceResponse;
import me.polonium.kasynobackend.balance.dto.TransactionResponse;
import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final BalanceService balanceService;

    public UserController(
            UserRepository userRepository,
            BalanceService balanceService
    ) {
        this.userRepository = userRepository;
        this.balanceService = balanceService;
    }

    @GetMapping("/me")
    public UserResponse getMe(Authentication authentication) {
        Long userId = getUserId(authentication);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getBalance()
        );
    }

    @GetMapping("/me/balance")
    public BalanceResponse getBalance(Authentication authentication) {
        Long userId = getUserId(authentication);

        return new BalanceResponse(
                balanceService.getBalance(userId)
        );
    }

    @GetMapping("/me/transactions")
    public List<TransactionResponse> getTransactions(
            Authentication authentication
    ) {
        Long userId = getUserId(authentication);

        return balanceService.getTransactions(userId);
    }

    private Long getUserId(Authentication authentication) {
        if (authentication == null ||
                !(authentication.getPrincipal() instanceof Long userId)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }

        return userId;
    }
}