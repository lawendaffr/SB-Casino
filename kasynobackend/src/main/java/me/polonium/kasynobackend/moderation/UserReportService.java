package me.polonium.kasynobackend.moderation;

import me.polonium.kasynobackend.entity.UserReport;
import me.polonium.kasynobackend.repository.UserReportRepository;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserReportService {
    private final UserRepository users;
    private final UserReportRepository reports;

    public UserReportService(UserRepository users, UserReportRepository reports) {
        this.users = users;
        this.reports = reports;
    }

    @Transactional
    public UserReport create(Long reporterId, Long targetId, String reason) {
        if (reporterId.equals(targetId)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "You cannot report your own account");
        var reporter = users.findById(reporterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        var target = users.findById(targetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reported user not found"));
        UserReport report = new UserReport();
        report.setReporter(reporter);
        report.setReporterUsername(reporter.getUsername());
        report.setTargetUserId(target.getId());
        report.setTargetUsername(target.getUsername());
        report.setReason(reason.trim());
        return reports.save(report);
    }
}
