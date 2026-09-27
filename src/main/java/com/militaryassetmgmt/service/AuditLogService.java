package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.response.AuditLogResponse;
import com.militaryassetmgmt.entity.AuditLog;
import com.militaryassetmgmt.entity.User;
import com.militaryassetmgmt.exception.ResourceNotFoundException;
import com.militaryassetmgmt.repository.AuditLogRepository;
import com.militaryassetmgmt.repository.UserRepository;
import com.militaryassetmgmt.util.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService implements IAuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(String entityType, Long entityId, String action,
                          String oldValues, String newValues, String changedFields,
                          String username, String ipAddress, String userAgent,
                          String correlationId, String sessionId) {
        try {
            User user = null;
            if (username != null) {
                user = userRepository.findByUsername(username).orElse(null);
            }

            AuditLog auditLog = AuditLog.builder()
                    .entityType(entityType)
                    .entityId(entityId)
                    .action(AuditLog.Action.valueOf(action.toUpperCase()))
                    .oldValues(oldValues)
                    .newValues(newValues)
                    .changedFields(changedFields)
                    .performedBy(user)
                    .performedAt(Instant.now())
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .correlationId(correlationId)
                    .sessionId(sessionId)
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("Audit logged: action={} entityType={} entityId={} user={}", action, entityType, entityId, username);
        } catch (Exception e) {
            log.error("Failed to write audit log: {}", e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> getAuditLogs(String entityType, Long entityId,
                                                       Long performedBy, String action,
                                                       Instant startDate, Instant endDate,
                                                       int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "performedAt"));
        Page<AuditLog> auditPage = auditLogRepository.findWithFilters(entityType, entityId, performedBy, action, startDate, endDate, pageable);
        return PageResponse.of(auditPage.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public AuditLogResponse getAuditLogById(Long id) {
        AuditLog auditLog = auditLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AuditLog not found with id: " + id));
        return mapToResponse(auditLog);
    }

    private AuditLogResponse mapToResponse(AuditLog auditLog) {
        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .entityType(auditLog.getEntityType())
                .entityId(auditLog.getEntityId())
                .action(auditLog.getAction().name())
                .oldValues(auditLog.getOldValues())
                .newValues(auditLog.getNewValues())
                .changedFields(auditLog.getChangedFields())
                .performedById(auditLog.getPerformedBy() != null ? auditLog.getPerformedBy().getId() : null)
                .performedByName(auditLog.getPerformedBy() != null ? auditLog.getPerformedBy().getFullName() : null)
                .performedAt(auditLog.getPerformedAt())
                .ipAddress(auditLog.getIpAddress())
                .userAgent(auditLog.getUserAgent())
                .correlationId(auditLog.getCorrelationId())
                .sessionId(auditLog.getSessionId())
                .build();
    }
}
