package com.militaryassetmgmt.service;

import com.militaryassetmgmt.entity.User;
import com.militaryassetmgmt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public User findByUsernameOrThrow(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new com.militaryassetmgmt.exception.ResourceNotFoundException("User not found with username: " + username));
    }

    @Override
    @Transactional(readOnly = true)
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new com.militaryassetmgmt.exception.ResourceNotFoundException("User not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> findByBaseId(Long baseId) {
        return userRepository.findByBaseId(baseId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> findByRoleName(String roleName) {
        return userRepository.findByRoleName(roleName);
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> findByActiveTrue() {
        return userRepository.findByActiveTrue();
    }

    @Override
    public void updateLastLogin(Long userId) {
        userRepository.updateLastLogin(userId, Instant.now());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByUsernameWithBaseAndRole(String username) {
        return userRepository.findByUsernameWithBaseAndRole(username);
    }

    @Override
    @Transactional(readOnly = true)
    public User getCurrentUserWithBase(String username) {
        return userRepository.findByUsernameWithBase(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }
}