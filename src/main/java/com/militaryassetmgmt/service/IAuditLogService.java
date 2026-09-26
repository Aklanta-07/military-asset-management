package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.response.AuditLogResponse;
import com.militaryassetmgmt.util.PageResponse;

import java.time.Instant;

public interface IAuditLogService {

    void logAction(String entityType, Long entityId, String action,
                   String oldValues, String newValues, String changedFields,
                   String username, String ipAddress, String userAgent,
                   String correlationId, String sessionId);

    PageResponse<AuditLogResponse> getAuditLogs(String entityType, Long entityId,
                                                Long performedBy, String action,
                                                Instant startDate, Instant endDate,
                                                int page, int size);

    AuditLogResponse getAuditLogById(Long id);
}
