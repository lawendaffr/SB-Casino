package me.polonium.kasynobackend.repository;

import me.polonium.kasynobackend.entity.AdminAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> { }
