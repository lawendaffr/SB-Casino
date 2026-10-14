package me.polonium.kasynobackend.moderation;

import jakarta.validation.Valid;
import me.polonium.kasynobackend.moderation.dto.CreateUserReportRequest;
import me.polonium.kasynobackend.moderation.dto.UserReportResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/reports")
public class UserReportController {
    private final UserReportService reportService;
    public UserReportController(UserReportService reportService) { this.reportService = reportService; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserReportResponse report(@Valid @RequestBody CreateUserReportRequest request,
                                     Authentication authentication) {
        return UserReportResponse.from(reportService.create((Long) authentication.getPrincipal(),
                request.targetUserId(), request.reason()));
    }
}
