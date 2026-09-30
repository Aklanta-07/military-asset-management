package com.militaryassetmgmt.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

import com.militaryassetmgmt.entity.AuditLog;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {

    private Long id;
    private String entityType;
    private Long entityId;
    private AuditLog.Action action;
    private String oldValues;
    private String newValues;
    private String changedFields;
    private Long performedById;
    private String performedByName;
    private Instant performedAt;
    private String ipAddress;
    private String userAgent;
    private String correlationId;
    private String sessionId;
}
