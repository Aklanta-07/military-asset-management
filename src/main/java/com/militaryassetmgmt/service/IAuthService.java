package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.request.AuthRequest;
import com.militaryassetmgmt.dto.response.AuthResponse;

public interface IAuthService {

    /**
     * Authenticates the user with the given credentials and returns JWT tokens.
     *
     * @param request the login request containing username and password
     * @return an {@link AuthResponse} containing access token, refresh token and user info
     */
    AuthResponse login(AuthRequest request);

    /**
     * Generates a new access token from a valid refresh token.
     *
     * @param refreshToken the refresh token issued at login
     * @return an {@link AuthResponse} with the new access token
     */
    AuthResponse refreshToken(String refreshToken);
}
