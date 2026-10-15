package me.polonium.kasynobackend.depositcode;

import me.polonium.kasynobackend.depositcode.dto.CreateDepositCodeRequest;
import me.polonium.kasynobackend.depositcode.dto.DepositCodeResponse;
import me.polonium.kasynobackend.admin.AuditLogService;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/codes")
public class AdminDepositCodeController {

    private final DepositCodeService depositCodeService;
    private final AuditLogService auditLogService;

    public AdminDepositCodeController(
            DepositCodeService depositCodeService,
            AuditLogService auditLogService
    ) {
        this.depositCodeService = depositCodeService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public DepositCodePage list(@RequestParam(defaultValue = "0") int page,
                                @RequestParam(defaultValue = "20") int size) {
        if (page < 0 || size < 1 || size > 100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Page must be non-negative and size must be between 1 and 100");
        var codes = depositCodeService.listCodes(PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))));
        return new DepositCodePage(codes.getContent(), codes.getNumber(), codes.getSize(),
                codes.getTotalElements(), codes.getTotalPages());
    }

    @PostMapping
    @Transactional
    public DepositCodeResponse create(
            @RequestBody CreateDepositCodeRequest request,
            Authentication authentication
    ) {
        DepositCodeResponse created = depositCodeService.createCode(request);
        auditLogService.record((Long) authentication.getPrincipal(), "CODE_CREATED", "DEPOSIT_CODE",
                created.code(), "amount=" + created.amount() + "; policy=" + created.redemptionPolicy());
        return created;
    }

    @PostMapping("/{code}/deactivate")
    @Transactional
    public DepositCodeResponse deactivate(@PathVariable String code, Authentication authentication) {
        DepositCodeResponse deactivated = depositCodeService.deactivateCode(code);
        auditLogService.record((Long) authentication.getPrincipal(), "CODE_DEACTIVATED", "DEPOSIT_CODE",
                deactivated.code(), "Code deactivated");
        return deactivated;
    }

    public record DepositCodePage(java.util.List<DepositCodeResponse> codes, int page,
                                  int pageSize, long totalElements, int totalPages) { }
}
