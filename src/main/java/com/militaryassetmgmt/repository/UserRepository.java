package com.militaryassetmgmt.repository;

import com.militaryassetmgmt.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.base.id = :baseId")
    List<User> findByBaseId(@Param("baseId") Long baseId);

    @Query("SELECT u FROM User u WHERE u.role.id = :roleId")
    List<User> findByRoleId(@Param("roleId") Long roleId);

    @Query("SELECT u FROM User u WHERE u.base.id = :baseId AND u.role.name = :roleName")
    List<User> findByBaseIdAndRoleName(@Param("baseId") Long baseId, @Param("roleName") String roleName);

    @Query("SELECT u FROM User u WHERE u.active = 1 AND u.base.id = :baseId")
    List<User> findActiveByBaseId(@Param("baseId") Long baseId);

    @Query("SELECT u FROM User u WHERE u.role.name = :roleName")
    List<User> findByRoleName(@Param("roleName") String roleName);

    @Query("SELECT u FROM User u WHERE u.active = true")
    List<User> findByActiveTrue();

    @Transactional
    @Modifying
    @Query("UPDATE User u SET u.lastLoginAt = :lastLoginAt WHERE u.id = :id")
    void updateLastLogin(@Param("id") Long id, @Param("lastLoginAt") Instant lastLoginAt);
}