package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.request.AuthRequest;
import com.militaryassetmgmt.dto.response.AuthResponse;
import com.militaryassetmgmt.entity.User;
import com.militaryassetmgmt.exception.ResourceNotFoundException;
import com.militaryassetmgmt.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService implements IAuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final UserDetailsService userDetailsService;

    @Override
    public AuthResponse login(AuthRequest request) {
        log.info("Login attempt for user: {}", request.getUsername());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String accessToken = jwtUtil.generateAccessToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        User user = userService.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", request.getUsername()));

        userService.updateLastLogin(user.getId());

        log.info("Login successful for user: {}", request.getUsername());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(3600L)
                .user(buildUserInfo(user))
                .build();
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        log.info("Processing refresh token request");

        String username = jwtUtil.extractUsername(refreshToken);
        if (username == null) {
            throw new IllegalArgumentException("Invalid refresh token: cannot extract username");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        if (!jwtUtil.validateToken(refreshToken, userDetails)) {
            throw new IllegalArgumentException("Refresh token is invalid or expired");
        }

        String newAccessToken = jwtUtil.generateAccessToken(userDetails);

        User user = userService.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        log.info("Refresh token processed successfully for user: {}", username);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken) // keep the same refresh token
                .tokenType("Bearer")
                .expiresIn(3600L)
                .user(buildUserInfo(user))
                .build();
    }

    private AuthResponse.UserInfo buildUserInfo(User user) {
        return AuthResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRoleName())
                .baseId(user.getBaseId())
                .baseCode(user.getBase() != null ? user.getBase().getCode() : null)
                .baseName(user.getBase() != null ? user.getBase().getName() : null)
                .build();
    }
}