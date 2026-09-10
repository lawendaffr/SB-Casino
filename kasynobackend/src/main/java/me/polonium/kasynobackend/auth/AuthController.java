package me.polonium.kasynobackend.auth;


import me.polonium.kasynobackend.auth.dto.RegisterRequest;
import me.polonium.kasynobackend.auth.dto.UserResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;


    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }
}
