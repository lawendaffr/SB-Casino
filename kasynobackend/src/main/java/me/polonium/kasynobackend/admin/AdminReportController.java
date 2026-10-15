package me.polonium.kasynobackend.admin;

import me.polonium.kasynobackend.admin.dto.AdminReportResponse;
import me.polonium.kasynobackend.repository.GameRecordRepository;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/moderation/reports")
public class AdminReportController {
    private final GameRecordRepository gameRecords;
    private final UserRepository users;

    public AdminReportController(GameRecordRepository gameRecords, UserRepository users) {
        this.gameRecords = gameRecords;
        this.users = users;
    }

    @GetMapping
    public AdminReportResponse getReport() {
        long completed = gameRecords.countCompletedGames();
        long bets = gameRecords.sumCompletedBets();
        long payouts = gameRecords.sumCompletedPayouts();
        return new AdminReportResponse(users.count(), gameRecords.countActiveGames(), completed,
                bets, payouts, payouts - bets);
    }
}
