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
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    public ApiResponse<DashboardSummary> getDashboardSummary(
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) Long equipmentTypeId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Authentication authentication) {

        LocalDate effectiveStartDate = startDate != null ? startDate : LocalDate.now().minusMonths(1);
        LocalDate effectiveEndDate = endDate != null ? endDate : LocalDate.now();

        DashboardSummary summary = dashboardService.getDashboardSummary(baseId, equipmentTypeId, effectiveStartDate, effectiveEndDate, authentication.getName());
        return ApiResponse.success(summary);
    }

    @GetMapping("/net-movement")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    public ApiResponse<List<NetMovementDetail>> getNetMovementDetail(
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) Long equipmentTypeId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Authentication authentication) {

        LocalDate effectiveStartDate = startDate != null ? startDate : LocalDate.now().minusMonths(1);
        LocalDate effectiveEndDate = endDate != null ? endDate : LocalDate.now();

        List<NetMovementDetail> details = dashboardService.getNetMovementDetail(baseId, equipmentTypeId, effectiveStartDate, effectiveEndDate, authentication.getName());
        return ApiResponse.success(details);
    }
}