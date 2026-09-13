package me.polonium.kasynobackend.auth;

import jakarta.transaction.Transactional;
import me.polonium.kasynobackend.auth.dto.AuthResponse;
import me.polonium.kasynobackend.auth.dto.LoginRequest;
import me.polonium.kasynobackend.auth.dto.RegisterRequest;
import me.polonium.kasynobackend.auth.dto.UserResponse;
import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.entity.UserRole;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

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
        user.setBalance(1000);
        user.setRole(UserRole.USER);

        User savedUser = userRepository.save(user);

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
        User user = refreshTokenService.validate(rawRefreshToken);

        String accessToken = jwtService.generateToken(
                user.getId(),
                user.getUsername()
        );
        return new AuthResponse(accessToken,rawRefreshToken);
    }
}
