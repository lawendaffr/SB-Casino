package me.polonium.kasynobackend.auth;

import jakarta.transaction.Transactional;
import me.polonium.kasynobackend.entity.RefreshToken;
import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.repository.RefreshTokenRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class RefreshTokenService {

    private static final int TOKEN_BYTES = 32;
    private static final long REFRESH_TOKEN_DAYS = 30;

    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public String create(User user) {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);

        String rawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(hash(rawToken));
        refreshToken.setCreatedAt(LocalDateTime.now());
        refreshToken.setExpiresAt(LocalDateTime.now().plusDays(REFRESH_TOKEN_DAYS));
        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }
    @Transactional
    public User validate(String rawToken) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid refresh token"));

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);

            throw new IllegalArgumentException(
                    "Refresh token has expired"
            );
        }
        return refreshToken.getUser();
    }
    public void delete(String rawToken) {
        refreshTokenRepository
                .findByTokenHash(hash(rawToken))
                .ifPresent(refreshTokenRepository::delete);
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    value.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
