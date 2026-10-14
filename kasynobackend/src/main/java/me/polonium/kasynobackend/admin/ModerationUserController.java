package me.polonium.kasynobackend.admin;

import me.polonium.kasynobackend.admin.dto.AdminUserResponse;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/moderation/users")
public class ModerationUserController {
    private final UserRepository userRepository;

    public ModerationUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public AdminUserController.AdminUserPage list(@RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "20") int size,
                                                   @RequestParam(required = false) String q) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Page must be non-negative and size must be between 1 and 100");
        }
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Order.asc("id")));
        var users = (q == null || q.isBlank()
                ? userRepository.findAll(pageable)
                : userRepository.findByUsernameContainingIgnoreCase(q.trim(), pageable))
                .map(AdminUserResponse::from);
        return AdminUserController.AdminUserPage.from(users);
    }
}
