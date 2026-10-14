package me.polonium.kasynobackend.auth;

import jakarta.transaction.Transactional;
import me.polonium.kasynobackend.auth.dto.AuthResponse;
import me.polonium.kasynobackend.auth.dto.LoginRequest;
import me.polonium.kasynobackend.auth.dto.RegisterRequest;
import me.polonium.kasynobackend.auth.dto.UserResponse;
import me.polonium.kasynobackend.auth.dto.RefreshResult;
import me.polonium.kasynobackend.entity.Transaction;
import me.polonium.kasynobackend.entity.TransactionType;
import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.entity.UserRole;
import me.polonium.kasynobackend.repository.TransactionRepository;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final TransactionRepository transactionRepository;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, RefreshTokenService refreshTokenService, TransactionRepository transactionRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.transactionRepository = transactionRepository;
    }
@Transactional
    public UserResponse register(RegisterRequest request) {
        if(userRepository.existsByUsername(request.username())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Username is already in use"
            );
        }
        User user = new User();

        user.setUsername(request.username());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.USER);

        User savedUser = userRepository.save(user);
        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setType(TransactionType.DEPOSIT);
        transaction.setAmount(1000);
        transaction.setBalanceBefore(0);
        transaction.setBalanceAfter(1000);
        transaction.setDescription("Initial fictional credits");
        transaction.setCreatedAt(LocalDateTime.now());

        transactionRepository.save(transaction);

        return new UserResponse(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getBalance()
        );
    }
    public AuthResponse login(LoginRequest request) {
        User user = userRepository
                .findByUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid username or password"
                ));
        if(!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid username or password"
            );
        }
        String accessToken = jwtService.generateToken(
                user.getId(),
                user.getUsername()
        );
        String refreshToken = refreshTokenService.create(user);
        return new AuthResponse(accessToken ,refreshToken);
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        RefreshResult result =
                refreshTokenService.rotate(rawRefreshToken);

        User user = result.user();

        String accessToken = jwtService.generateToken(
                user.getId(),
                user.getUsername()
        );

        return new AuthResponse(
                accessToken,
                result.refreshToken()
        );
    }
    public void logout(String rawRefreshToken) {
        refreshTokenService.delete(rawRefreshToken);
    }
}
