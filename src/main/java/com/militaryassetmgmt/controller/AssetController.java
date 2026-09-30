package com.militaryassetmgmt.controller;

import com.militaryassetmgmt.dto.response.AssetResponse;
import com.militaryassetmgmt.entity.Asset;
import com.militaryassetmgmt.service.AssetService;
import com.militaryassetmgmt.util.ApiResponse;
import com.militaryassetmgmt.util.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    public ApiResponse<PageResponse<AssetResponse>> getAssets(
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) Long equipmentTypeId,
            @RequestParam(required = false) Asset.Status status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        PageResponse<AssetResponse> response =
                assetService.getAssets(
                        baseId,
                        equipmentTypeId,
                        status,
                        page,
                        size,
                        authentication.getName()
                );

        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    public ApiResponse<AssetResponse> getAssetById(
            @PathVariable Long id,
            Authentication authentication) {

        AssetResponse response =
                assetService.getAssetById(
                        id,
                        authentication.getName()
                );

        return ApiResponse.success(response);
    }
}