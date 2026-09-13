package me.polonium.kasynobackend.user;


import me.polonium.kasynobackend.auth.dto.UserResponse;
import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();

        User user = userRepository.findById(userId)
                .orElseThrow();
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getBalance()
        );
    }
}
