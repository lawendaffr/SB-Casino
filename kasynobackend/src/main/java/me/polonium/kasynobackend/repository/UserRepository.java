package me.polonium.kasynobackend.repository;

import jakarta.persistence.LockModeType;
import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmailIgnoreCase(String email);
    Optional<User> findByUsernameIgnoreCase(String username);
    Page<User> findByUsernameContainingIgnoreCase(String username, Pageable pageable);
    long countByRole(UserRole role);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.role = :role")
    List<User> findAllByRoleForUpdate(@Param("role") UserRole role);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Long id);
}
