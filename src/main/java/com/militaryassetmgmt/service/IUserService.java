package com.militaryassetmgmt.service;

import com.militaryassetmgmt.entity.User;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for managing user data and user-related operations.
 */
public interface IUserService {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    User findByUsernameOrThrow(String username);

    User findById(Long id);

    List<User> findAll();

    List<User> findByBaseId(Long baseId);

    List<User> findByRoleName(String roleName);

    List<User> findByActiveTrue();

    void updateLastLogin(Long userId);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<User> findByUsernameWithBaseAndRole(String username);

    User getCurrentUserWithBase(String username);
}
