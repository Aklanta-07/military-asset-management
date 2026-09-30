package com.militaryassetmgmt.repository;

import com.militaryassetmgmt.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId);

    @Query("SELECT a FROM AuditLog a WHERE a.performedBy.id = :performedBy")
    List<AuditLog> findByPerformedBy(@Param("performedBy") Long performedBy);

    List<AuditLog> findByCorrelationId(String correlationId);

    @Query("SELECT a FROM AuditLog a WHERE a.performedAt BETWEEN :startDate AND :endDate ORDER BY a.performedAt DESC")
    List<AuditLog> findByDateRange(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate);

    @Query("""
    SELECT a FROM AuditLog a
    WHERE (:entityType IS NULL OR a.entityType = :entityType)
      AND (:entityId IS NULL OR a.entityId = :entityId)
      AND (:performedBy IS NULL OR a.performedBy.id = :performedBy)
      AND (:action IS NULL OR a.action = :action)
      AND (CAST(:startDate AS timestamp) IS NULL OR a.performedAt >= :startDate)
      AND (CAST(:endDate AS timestamp) IS NULL OR a.performedAt <= :endDate)
    ORDER BY a.performedAt DESC
    """)
    Page<AuditLog> findWithFilters(
    @Param("entityType") String entityType,
    @Param("entityId") Long entityId,
    @Param("performedBy") Long performedBy,
    @Param("action") AuditLog.Action action,
    @Param("startDate") Instant startDate,
    @Param("endDate") Instant endDate,
    Pageable pageable
    );
}