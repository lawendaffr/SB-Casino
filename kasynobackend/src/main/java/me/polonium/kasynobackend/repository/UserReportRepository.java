package me.polonium.kasynobackend.repository;

import me.polonium.kasynobackend.entity.UserReport;
import me.polonium.kasynobackend.entity.UserReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserReportRepository extends JpaRepository<UserReport, Long> {
    Page<UserReport> findByStatus(UserReportStatus status, Pageable pageable);
}
