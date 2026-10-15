package me.polonium.kasynobackend.user;

import me.polonium.kasynobackend.auth.dto.UserResponse;
import me.polonium.kasynobackend.balance.BalanceService;
import me.polonium.kasynobackend.balance.dto.BalanceResponse;
import me.polonium.kasynobackend.balance.dto.TransactionResponse;
import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.entity.UserRole;
import me.polonium.kasynobackend.repository.GameRecordRepository;
import me.polonium.kasynobackend.repository.RefreshTokenRepository;
import me.polonium.kasynobackend.repository.ModerationActionRepository;
import me.polonium.kasynobackend.repository.UserRepository;
import me.polonium.kasynobackend.user.dto.GameHistoryResponse;
import me.polonium.kasynobackend.user.dto.GameRecordResponse;
import me.polonium.kasynobackend.user.dto.GameStatisticsResponse;
import me.polonium.kasynobackend.user.dto.LeaderboardEntryResponse;
import me.polonium.kasynobackend.user.dto.LeaderboardResponse;
import me.polonium.kasynobackend.user.dto.UpdateAccountRequest;
import me.polonium.kasynobackend.user.dto.PublicUserProfileResponse;
import me.polonium.kasynobackend.user.dto.AccountResponse;
import me.polonium.kasynobackend.user.dto.PublicUserSummaryResponse;
import me.polonium.kasynobackend.user.dto.DeleteAccountRequest;
import me.polonium.kasynobackend.moderation.dto.ModerationActionResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
    private final GameRecordRepository gameRecordRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ModerationActionRepository moderationActionRepository;

    public UserController(
            UserRepository userRepository,
            BalanceService balanceService,
            GameRecordRepository gameRecordRepository,
            PasswordEncoder passwordEncoder,
            RefreshTokenRepository refreshTokenRepository,
            ModerationActionRepository moderationActionRepository
    ) {
        this.userRepository = userRepository;
        this.balanceService = balanceService;
        this.gameRecordRepository = gameRecordRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenRepository = refreshTokenRepository;
        this.moderationActionRepository = moderationActionRepository;
    }

    @PatchMapping("/me/account")
    @Transactional
    public AccountResponse updateAccount(Authentication authentication,
                                         @Valid @RequestBody UpdateAccountRequest request) {
        Long userId = getUserId(authentication);
        User user = userRepository.findById(userId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (request.username() != null && !request.username().isBlank()) {
            if (!request.username().equals(user.getUsername()) && userRepository.existsByUsername(request.username())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already in use");
            }
            user.setUsername(request.username());
        }
        if (request.email() != null && !request.email().isBlank()) {
            if (!request.email().equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmailIgnoreCase(request.email())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use");
            }
            user.setEmail(request.email());
        }
        if (request.newPassword() != null) {
            if (request.currentPassword() == null || !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
            }
            user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
            refreshTokenRepository.deleteByUserId(userId);
        }
        return new AccountResponse(user.getId(), user.getUsername(), user.getEmail());
    }

    @GetMapping("/me/account")
    public AccountResponse getMyAccount(Authentication authentication) {
        Long userId = getUserId(authentication);
        User user = userRepository.findById(userId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return new AccountResponse(user.getId(), user.getUsername(), user.getEmail());
    }

    @GetMapping("/{userId}/profile")
    public PublicUserProfileResponse getPublicProfile(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        var stats = gameRecordRepository.getStatistics(userId);
        return new PublicUserProfileResponse(user.getId(), user.getUsername(), stats.getGamesPlayed(),
                stats.getWins(), stats.getNetResult());
    }

    @GetMapping("/search")
    public PublicUserSearchPage searchUsers(@RequestParam String q,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        if (q == null || q.isBlank() || page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Search query is required; page must be non-negative and size between 1 and 100");
        }
        var result = userRepository.findByUsernameContainingIgnoreCase(q.trim(),
                PageRequest.of(page, size, Sort.by(Sort.Order.asc("username"))))
                .map(PublicUserSummaryResponse::from);
        return new PublicUserSearchPage(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteMyAccount(Authentication authentication,
                                @Valid @RequestBody DeleteAccountRequest request) {
        Long userId = getUserId(authentication);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        if (user.getRole() == UserRole.ADMIN
                && userRepository.findAllByRoleForUpdate(UserRole.ADMIN).size() <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "The last admin account cannot be deleted");
        }
        refreshTokenRepository.deleteByUserId(userId);
        refreshTokenRepository.flush();
        userRepository.delete(user);
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

    @GetMapping("/me/games")
    public GameHistoryResponse getGames(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Long userId = getUserId(authentication);
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Page must be non-negative and size must be between 1 and 100");
        }

        var games = gameRecordRepository.findByUserId(userId,
                PageRequest.of(page, size, Sort.by(
                        Sort.Order.desc("createdAt"), Sort.Order.desc("id"))))
                .map(GameRecordResponse::from);
        return GameHistoryResponse.from(games);
    }

    @GetMapping("/me/stats")
    public GameStatisticsResponse getGameStatistics(Authentication authentication) {
        Long userId = getUserId(authentication);
        return GameStatisticsResponse.from(gameRecordRepository.getStatistics(userId));
    }

    @GetMapping("/me/moderation-actions")
    public ModerationActionPage getMyModerationActions(Authentication authentication,
                                                        @RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "20") int size) {
        Long userId = getUserId(authentication);
        if (page < 0 || size < 1 || size > 100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Page must be non-negative and size must be between 1 and 100");
        var result = moderationActionRepository.findByTargetUserIdOrderByCreatedAtDesc(userId,
                PageRequest.of(page, size)).map(ModerationActionResponse::from);
        return new ModerationActionPage(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @GetMapping("/leaderboard")
    public LeaderboardResponse getLeaderboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Page must be non-negative and size must be between 1 and 100");
        }
        var entries = gameRecordRepository.findLeaderboard(PageRequest.of(page, size))
                .map(LeaderboardEntryResponse::from);
        return LeaderboardResponse.from(entries);
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

    public record PublicUserSearchPage(List<PublicUserSummaryResponse> users, int page,
                                       int pageSize, long totalElements, int totalPages) { }
    public record ModerationActionPage(List<ModerationActionResponse> actions, int page,
                                       int pageSize, long totalElements, int totalPages) { }
}
