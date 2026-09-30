package com.militaryassetmgmt.controller;

import com.militaryassetmgmt.dto.request.AuthRequest;
import com.militaryassetmgmt.dto.response.AuthResponse;
import com.militaryassetmgmt.entity.User;
import com.militaryassetmgmt.service.IAuthService;
import com.militaryassetmgmt.service.IUserService;
import com.militaryassetmgmt.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and token management endpoints")
public class AuthController {

    private final IAuthService authService;
    private final IUserService userService;

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticate with username and password to get JWT access & refresh tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Get a new access token using a valid refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @RequestHeader(value = "X-Refresh-Token", required = false) String headerToken,
            @RequestBody(required = false) String bodyToken) {
        String token = headerToken != null ? headerToken : bodyToken;
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Refresh token is required", 400, "/api/auth/refresh"));
        }
        AuthResponse response = authService.refreshToken(token.replace("Bearer ", "").trim());
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Current user profile", description = "Get details of currently authenticated user")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized", 401, "/api/auth/me"));
        }
        User user = userService.getCurrentUserWithBase(authentication.getName());
        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRoleName())
                .baseId(user.getBaseId())
                .baseCode(user.getBase() != null ? user.getBase().getCode() : null)
                .baseName(user.getBase() != null ? user.getBase().getName() : null)
                .build();
        return ResponseEntity.ok(ApiResponse.success(userInfo));
    }
}
