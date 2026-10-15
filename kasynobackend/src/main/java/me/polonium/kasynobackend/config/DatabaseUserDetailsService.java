package me.polonium.kasynobackend.config;

import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public DatabaseUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found"
                ));

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPasswordHash())
                .roles(user.getRole().name())
                .disabled(user.getAccountStatus() == me.polonium.kasynobackend.entity.AccountStatus.BANNED)
                .accountLocked(user.getSuspendedUntil() != null
                        && user.getSuspendedUntil().isAfter(java.time.LocalDateTime.now()))
                .build();
    }
}
