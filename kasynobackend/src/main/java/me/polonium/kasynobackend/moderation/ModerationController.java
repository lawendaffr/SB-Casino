package me.polonium.kasynobackend.moderation;

import jakarta.validation.Valid;
import me.polonium.kasynobackend.admin.AuditLogService;
import me.polonium.kasynobackend.entity.ModerationActionType;
import me.polonium.kasynobackend.entity.UserReportStatus;
import me.polonium.kasynobackend.moderation.dto.*;
import me.polonium.kasynobackend.repository.UserReportRepository;
import me.polonium.kasynobackend.repository.ModerationActionRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/moderation")
public class ModerationController {
    private final ModerationService moderationService;
    private final UserReportRepository reports;
    private final AuditLogService audit;
    private final ModerationActionRepository actions;

    public ModerationController(ModerationService moderationService,
                                UserReportRepository reports, AuditLogService audit,
                                ModerationActionRepository actions) {
        this.moderationService = moderationService;
        this.reports = reports;
        this.audit = audit;
        this.actions = actions;
    }

    @PostMapping("/users/{userId}/warn")
    public ModerationActionResponse warn(@PathVariable Long userId,
                                         @Valid @RequestBody ModerationRequest request,
                                         Authentication authentication) {
        return action(userId, ModerationActionType.WARNING, request, authentication);
    }

    @PostMapping("/users/{userId}/timeout")
    public ModerationActionResponse timeout(@PathVariable Long userId,
                                            @Valid @RequestBody ModerationRequest request,
                                            Authentication authentication) {
        return action(userId, ModerationActionType.TIMEOUT, request, authentication);
    }

    @PostMapping("/users/{userId}/ban")
    public ModerationActionResponse ban(@PathVariable Long userId,
                                        @Valid @RequestBody ModerationRequest request,
                                        Authentication authentication) {
        return action(userId, ModerationActionType.BAN, request, authentication);
    }

    @PostMapping("/users/{userId}/unban")
    public ModerationActionResponse unban(@PathVariable Long userId,
                                          @Valid @RequestBody ModerationRequest request,
                                          Authentication authentication) {
        return action(userId, ModerationActionType.UNBAN, request, authentication);
    }

    @GetMapping("/user-reports")
    public ReportPage listReports(@RequestParam(defaultValue = "OPEN") UserReportStatus status,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "20") int size) {
        validatePage(page, size);
        var result = reports.findByStatus(status, PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))))
                .map(UserReportResponse::from);
        return new ReportPage(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @PatchMapping("/user-reports/{reportId}")
    @Transactional
    public UserReportResponse updateReport(@PathVariable Long reportId,
                                           @Valid @RequestBody ReportStatusRequest request,
                                           Authentication authentication) {
        var report = reports.findById(reportId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
        report.setStatus(request.status());
        audit.record((Long) authentication.getPrincipal(), "USER_REPORT_" + request.status(),
                "USER_REPORT", reportId.toString(), "Report review status updated");
        return UserReportResponse.from(report);
    }

    @GetMapping("/users/{userId}/actions")
    public ActionPage listActions(@PathVariable Long userId,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "20") int size) {
        validatePage(page, size);
        var result = actions.findByTargetUserIdOrderByCreatedAtDesc(userId,
                PageRequest.of(page, size));
        var content = result.map(ModerationActionResponse::from);
        return new ActionPage(content.getContent(), content.getNumber(), content.getSize(),
                content.getTotalElements(), content.getTotalPages());
    }

    private ModerationActionResponse action(Long userId, ModerationActionType type,
                                            ModerationRequest request, Authentication authentication) {
        return ModerationActionResponse.from(moderationService.apply(
                (Long) authentication.getPrincipal(), userId, type, request.reason(), request.hours()));
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Page must be non-negative and size must be between 1 and 100");
    }

    public record ReportPage(List<UserReportResponse> reports, int page, int pageSize,
                             long totalElements, int totalPages) { }
    public record ActionPage(List<ModerationActionResponse> actions, int page, int pageSize,
                             long totalElements, int totalPages) { }
}
