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
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new com.militaryassetmgmt.exception.ResourceNotFoundException("User not found with id: " + id));
    }

    @Override
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    public List<User> findByBaseId(Long baseId) {
        return userRepository.findByBaseId(baseId);
    }

    @Override
    public List<User> findByRoleName(String roleName) {
        return userRepository.findByRoleName(roleName);
    }

    @Override
    public List<User> findByActiveTrue() {
        return userRepository.findByActiveTrue();
    }

    @Override
    @Transactional
    public void updateLastLogin(Long userId) {
        userRepository.updateLastLogin(userId, Instant.now());
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public Optional<User> findByUsernameWithBaseAndRole(String username) {
        return userRepository.findByUsernameWithBaseAndRole(username);
    }
}