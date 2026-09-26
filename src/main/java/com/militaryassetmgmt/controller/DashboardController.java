package com.militaryassetmgmt.controller;

import com.militaryassetmgmt.dto.response.DashboardSummary;
import com.militaryassetmgmt.dto.response.NetMovementDetail;
import com.militaryassetmgmt.entity.User;
import com.militaryassetmgmt.service.IDashboardService;
import com.militaryassetmgmt.service.IUserService;
import com.militaryassetmgmt.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
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
@Tag(name = "Dashboard", description = "Dashboard analytics, inventory metrics, and net movement reports")
public class DashboardController {

    private final IDashboardService dashboardService;
    private final IUserService userService;

    @GetMapping("/summary")
    @Operation(summary = "Get Dashboard Summary", description = "Retrieve Opening Balance, Closing Balance, Net Movement, Assigned and Expended counts")
    public ResponseEntity<ApiResponse<DashboardSummary>> getSummary(
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) Long equipmentTypeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {

        Long effectiveBaseId = resolveEffectiveBaseId(baseId, authentication);
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        DashboardSummary summary = dashboardService.getDashboardSummary(effectiveBaseId, equipmentTypeId, start, end);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/net-movement")
    @Operation(summary = "Get Net Movement Details", description = "Detailed breakdown of purchases, transfers in, and transfers out by equipment type for pop-up display")
    public ResponseEntity<ApiResponse<List<NetMovementDetail>>> getNetMovement(
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) Long equipmentTypeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {

        Long effectiveBaseId = resolveEffectiveBaseId(baseId, authentication);
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        List<NetMovementDetail> details = dashboardService.getNetMovementDetail(effectiveBaseId, equipmentTypeId, start, end);
        return ResponseEntity.ok(ApiResponse.success(details));
    }

    private Long resolveEffectiveBaseId(Long requestedBaseId, Authentication authentication) {
        if (authentication == null) {
            return requestedBaseId;
        }
        User user = userService.findByUsername(authentication.getName()).orElse(null);
        if (user == null || user.isAdmin()) {
            return requestedBaseId; // Admins can view any base or null for all
        }
        // Non-admins are scoped to their assigned base
        return user.getBaseId();
    }
}
