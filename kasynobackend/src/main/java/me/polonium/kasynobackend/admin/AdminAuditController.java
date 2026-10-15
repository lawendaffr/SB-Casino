package me.polonium.kasynobackend.admin;

import me.polonium.kasynobackend.admin.dto.AuditLogResponse;
import me.polonium.kasynobackend.repository.AdminAuditLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/logs")
public class AdminAuditController {
    private final AdminAuditLogRepository logs;
    public AdminAuditController(AdminAuditLogRepository logs) { this.logs = logs; }

    @GetMapping
    public AdminAuditPage list(@RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "20") int size) {
        if (page < 0 || size < 1 || size > 100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Page must be non-negative and size must be between 1 and 100");
        var results = logs.findAll(PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))))
                .map(AuditLogResponse::from);
        return new AdminAuditPage(results.getContent(), results.getNumber(), results.getSize(),
                results.getTotalElements(), results.getTotalPages());
    }

    public record AdminAuditPage(java.util.List<AuditLogResponse> logs, int page,
                                 int pageSize, long totalElements, int totalPages) { }
}
