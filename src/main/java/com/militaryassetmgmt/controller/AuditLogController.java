package com.militaryassetmgmt.controller;

import com.militaryassetmgmt.util.ApiResponse;
import com.militaryassetmgmt.dto.response.AuditLogResponse;
import com.militaryassetmgmt.entity.AuditLog;
import com.militaryassetmgmt.service.AuditLogService;
import com.militaryassetmgmt.util.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResponse<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long entityId,
            @RequestParam(required = false) Long performedBy,
            @RequestParam(required = false) AuditLog.Action action,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageResponse<AuditLogResponse> response =
                auditLogService.getAuditLogs(
                        entityType,
                        entityId,
                        performedBy,
                        action,
                        startDate,
                        endDate,
                        page,
                        size
                );

        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AuditLogResponse> getAuditLogById(
            @PathVariable Long id) {

        AuditLogResponse response =
                auditLogService.getAuditLogById(id);

        return ApiResponse.success(response);
    }
}