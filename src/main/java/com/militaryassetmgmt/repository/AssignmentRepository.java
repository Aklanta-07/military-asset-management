package com.militaryassetmgmt.repository;

import com.militaryassetmgmt.entity.Assignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    @Query("SELECT a FROM Assignment a WHERE a.asset.id = :assetId")
    List<Assignment> findByAssetId(@Param("assetId") Long assetId);

    @Query("SELECT a FROM Assignment a WHERE a.personnel.id = :personnelId")
    List<Assignment> findByPersonnelId(@Param("personnelId") Long personnelId);

    List<Assignment> findByStatus(Assignment.Status status);

    @Query("SELECT a FROM Assignment a WHERE a.assignedBy.id = :assignedBy")
    List<Assignment> findByAssignedBy(@Param("assignedBy") Long assignedBy);

    @Query("SELECT a FROM Assignment a WHERE a.asset.id = :assetId AND a.status = 'ACTIVE'")
    Optional<Assignment> findActiveByAssetId(@Param("assetId") Long assetId);

    @Query("SELECT a FROM Assignment a WHERE a.personnel.id = :personnelId AND a.status = 'ACTIVE'")
    List<Assignment> findActiveByPersonnelId(@Param("personnelId") Long personnelId);

    @Query("SELECT COUNT(a) FROM Assignment a WHERE a.asset.base.id = :baseId AND a.status = 'ACTIVE' AND a.assignedDate BETWEEN :startDate AND :endDate")
    Long countActiveAssignmentsByBaseIdAndDateRange(@Param("baseId") Long baseId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("""
            SELECT COUNT(a) 
            FROM Assignment a 
            WHERE (:baseId IS NULL OR a.asset.base.id = :baseId) 
            AND a.status = 'ACTIVE' 
            AND a.assignedDate BETWEEN :startDate AND :endDate
            """)
    Long countActiveAssignmentsByDateRange(@Param("baseId") Long baseId, @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            SELECT a 
            FROM Assignment a 
            WHERE a.assignedDate BETWEEN :startDate AND :endDate 
            ORDER BY a.assignedDate DESC
            """)
    List<Assignment> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("""
            SELECT a
            FROM Assignment a
            WHERE (:assetId IS NULL OR a.asset.id = :assetId)
            AND (:personnelId IS NULL OR a.personnel.id = :personnelId)
            AND (:status IS NULL OR a.status = :status)
            AND (:startDate IS NULL OR a.assignedDate >= :startDate)
            AND (:endDate IS NULL OR a.assignedDate <= :endDate)
            ORDER BY a.assignedDate DESC
            """)
    Page<Assignment> findWithFilters(@Param("assetId") Long assetId, @Param("personnelId") Long personnelId, @Param("status") String status, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);

    @Query("""
        SELECT a
        FROM Assignment a
        WHERE a.asset.base.id = :baseId
        AND (:assetId IS NULL OR a.asset.id = :assetId)
        AND (:personnelId IS NULL OR a.personnel.id = :personnelId)
        AND (:status IS NULL OR a.status = :status)
        AND (:startDate IS NULL OR a.assignedDate >= :startDate)
        AND (:endDate IS NULL OR a.assignedDate <= :endDate)
        ORDER BY a.assignedDate DESC
        """)
Page<Assignment> findWithFiltersAndBase(
        @Param("baseId") Long baseId,
        @Param("assetId") Long assetId,
        @Param("personnelId") Long personnelId,
        @Param("status") String status,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable);

    @Query("""
            SELECT COUNT(a) 
            FROM Assignment a 
            WHERE a.asset.base.id = :baseId 
            AND a.asset.equipmentType.id = :equipmentTypeId 
            AND a.status = 'ACTIVE'
            """)
    Long countActiveByBaseAndEquipmentType(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId);
}