package com.militaryassetmgmt.controller;

import com.militaryassetmgmt.util.ApiResponse;
import com.militaryassetmgmt.dto.response.DashboardSummary;
import com.militaryassetmgmt.dto.response.NetMovementDetail;
import com.militaryassetmgmt.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
    public ApiResponse<DashboardSummary> getDashboardSummary(
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) Long equipmentTypeId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Authentication authentication) {

        // If user is BASE_COMMANDER or LOGISTICS_OFFICER, override baseId to their assigned base
        Long effectiveBaseId = getEffectiveBaseId(baseId, authentication);

        LocalDate effectiveStartDate = startDate != null ? startDate : LocalDate.now().minusMonths(1);
        LocalDate effectiveEndDate = endDate != null ? endDate : LocalDate.now();

        DashboardSummary summary = dashboardService.getDashboardSummary(effectiveBaseId, equipmentTypeId, effectiveStartDate, effectiveEndDate);
        return ApiResponse.success(summary);
    }

    @GetMapping("/net-movement")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
    public ApiResponse<List<NetMovementDetail>> getNetMovementDetail(
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) Long equipmentTypeId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Authentication authentication) {

        Long effectiveBaseId = getEffectiveBaseId(baseId, authentication);
        LocalDate effectiveStartDate = startDate != null ? startDate : LocalDate.now().minusMonths(1);
        LocalDate effectiveEndDate = endDate != null ? endDate : LocalDate.now();

        List<NetMovementDetail> details = dashboardService.getNetMovementDetail(effectiveBaseId, equipmentTypeId, effectiveStartDate, effectiveEndDate);
        return ApiResponse.success(details);
    }

    private Long getEffectiveBaseId(Long requestedBaseId, Authentication authentication) {
        // Admin can view any base
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if(isAdmin) {
            return requestedBaseId;
        }
        
        // Base Commander and Logistics Officer can only view their assigned base
        return getUserBaseId(authentication);
    }

    private Long getUserBaseId(Authentication authentication) {
        // Extract baseId from JWT token - this would be set in the token
        // For now, we'll return null which will be handled by the service
        return null;
    }
}