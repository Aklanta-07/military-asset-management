package com.militaryassetmgmt.repository;

import com.militaryassetmgmt.entity.Transfer;
import com.militaryassetmgmt.dto.response.TransferSummary;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TransferRepository extends JpaRepository<Transfer, Long> {

    @Query("SELECT t FROM Transfer t LEFT JOIN FETCH t.fromBase LEFT JOIN FETCH t.toBase LEFT JOIN FETCH t.equipmentType WHERE t.fromBase.id = :fromBaseId")
    List<Transfer> findByFromBaseId(@Param("fromBaseId") Long fromBaseId);

    @Query("SELECT t FROM Transfer t LEFT JOIN FETCH t.fromBase LEFT JOIN FETCH t.toBase LEFT JOIN FETCH t.equipmentType WHERE t.toBase.id = :toBaseId")
    List<Transfer> findByToBaseId(@Param("toBaseId") Long toBaseId);

    @Query("SELECT t FROM Transfer t LEFT JOIN FETCH t.fromBase LEFT JOIN FETCH t.toBase LEFT JOIN FETCH t.equipmentType WHERE t.equipmentType.id = :equipmentTypeId")
    List<Transfer> findByEquipmentTypeId(@Param("equipmentTypeId") Long equipmentTypeId);

    List<Transfer> findByStatus(Transfer.Status status);

    @Query("SELECT t FROM Transfer t LEFT JOIN FETCH t.fromBase LEFT JOIN FETCH t.toBase LEFT JOIN FETCH t.equipmentType WHERE t.requestedBy.id = :requestedBy")
    List<Transfer> findByRequestedBy(@Param("requestedBy") Long requestedBy);

    @Query("SELECT t FROM Transfer t LEFT JOIN FETCH t.fromBase LEFT JOIN FETCH t.toBase LEFT JOIN FETCH t.equipmentType WHERE t.fromBase.id = :fromBaseId AND t.toBase.id = :toBaseId ORDER BY t.transferDate DESC")
    List<Transfer> findByFromBaseAndToBase(@Param("fromBaseId") Long fromBaseId, @Param("toBaseId") Long toBaseId);

    @Query("SELECT t FROM Transfer t LEFT JOIN FETCH t.fromBase LEFT JOIN FETCH t.toBase LEFT JOIN FETCH t.equipmentType WHERE (t.fromBase.id = :baseId OR t.toBase.id = :baseId) AND t.transferDate BETWEEN :startDate AND :endDate ORDER BY t.transferDate DESC")
    List<Transfer> findByBaseIdAndDateRange(@Param("baseId") Long baseId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT t FROM Transfer t LEFT JOIN FETCH t.fromBase LEFT JOIN FETCH t.toBase LEFT JOIN FETCH t.equipmentType LEFT JOIN FETCH t.requestedBy LEFT JOIN FETCH t.approvedBy LEFT JOIN FETCH t.receivedBy LEFT JOIN FETCH t.cancelledBy WHERE (:fromBaseId IS NULL OR t.fromBase.id = :fromBaseId) AND (:toBaseId IS NULL OR t.toBase.id = :toBaseId) AND (:equipmentTypeId IS NULL OR t.equipmentType.id = :equipmentTypeId) AND (:status IS NULL OR t.status = :status) AND (:startDate IS NULL OR t.transferDate >= :startDate) AND (:endDate IS NULL OR t.transferDate <= :endDate) ORDER BY t.transferDate DESC")
    Page<Transfer> findWithFilters(@Param("fromBaseId") Long fromBaseId, @Param("toBaseId") Long toBaseId, @Param("equipmentTypeId") Long equipmentTypeId, @Param("status") Transfer.Status status, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.quantity), 0) FROM Transfer t WHERE t.toBase.id = :baseId AND t.equipmentType.id = :equipmentTypeId AND t.status IN ('RECEIVED', 'IN_TRANSIT') AND t.transferDate BETWEEN :startDate AND :endDate")
    Long sumTransfersInByBaseAndEquipmentTypeAndDateRange(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(t.quantity), 0) FROM Transfer t WHERE t.fromBase.id = :baseId AND t.equipmentType.id = :equipmentTypeId AND t.status IN ('APPROVED', 'IN_TRANSIT', 'RECEIVED') AND t.transferDate BETWEEN :startDate AND :endDate")
    Long sumTransfersOutByBaseAndEquipmentTypeAndDateRange(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(t.quantity), 0) FROM Transfer t WHERE (:baseId IS NULL OR t.toBase.id = :baseId) AND t.status IN ('RECEIVED', 'IN_TRANSIT') AND t.transferDate BETWEEN :startDate AND :endDate")
    Long sumQuantityReceivedByDateRange(@Param("baseId") Long baseId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(t.quantity), 0) FROM Transfer t WHERE (:baseId IS NULL OR t.fromBase.id = :baseId) AND t.status IN ('APPROVED', 'IN_TRANSIT', 'RECEIVED') AND t.transferDate BETWEEN :startDate AND :endDate")
    Long sumQuantitySentByDateRange(@Param("baseId") Long baseId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(t.quantity), 0) FROM Transfer t WHERE t.toBase.id = :baseId AND t.status IN ('RECEIVED', 'IN_TRANSIT') AND t.transferDate BETWEEN :startDate AND :endDate")
    Long sumQuantityReceivedByBaseIdAndDateRange(@Param("baseId") Long baseId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(t.quantity), 0) FROM Transfer t WHERE t.fromBase.id = :baseId AND t.status IN ('APPROVED', 'IN_TRANSIT', 'RECEIVED') AND t.transferDate BETWEEN :startDate AND :endDate")
    Long sumQuantitySentByBaseIdAndDateRange(@Param("baseId") Long baseId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT new com.militaryassetmgmt.dto.response.TransferSummary(t.id, t.quantity, t.transferDate, t.status, fb.code, tb.code, fb.name, tb.name) " +
           "FROM Transfer t JOIN t.fromBase fb JOIN t.toBase tb " +
           "WHERE t.equipmentType.id = :equipmentTypeId AND t.status IN ('RECEIVED', 'IN_TRANSIT') AND t.transferDate BETWEEN :startDate AND :endDate ORDER BY t.transferDate DESC")
    List<TransferSummary> findReceivedSummaryByEquipmentTypeIdAndDateRange(@Param("equipmentTypeId") Long equipmentTypeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT new com.militaryassetmgmt.dto.response.TransferSummary(t.id, t.quantity, t.transferDate, t.status, fb.code, tb.code, fb.name, tb.name) " +
           "FROM Transfer t JOIN t.fromBase fb JOIN t.toBase tb " +
           "WHERE t.toBase.id = :baseId AND t.equipmentType.id = :equipmentTypeId AND t.status IN ('RECEIVED', 'IN_TRANSIT') AND t.transferDate BETWEEN :startDate AND :endDate ORDER BY t.transferDate DESC")
    List<TransferSummary> findReceivedSummaryByBaseIdAndEquipmentTypeIdAndDateRange(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT new com.militaryassetmgmt.dto.response.TransferSummary(t.id, t.quantity, t.transferDate, t.status, fb.code, tb.code, fb.name, tb.name) " +
           "FROM Transfer t JOIN t.fromBase fb JOIN t.toBase tb " +
           "WHERE t.equipmentType.id = :equipmentTypeId AND t.status IN ('APPROVED', 'IN_TRANSIT', 'RECEIVED') AND t.transferDate BETWEEN :startDate AND :endDate ORDER BY t.transferDate DESC")
    List<TransferSummary> findSentSummaryByEquipmentTypeIdAndDateRange(@Param("equipmentTypeId") Long equipmentTypeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT new com.militaryassetmgmt.dto.response.TransferSummary(t.id, t.quantity, t.transferDate, t.status, fb.code, tb.code, fb.name, tb.name) " +
           "FROM Transfer t JOIN t.fromBase fb JOIN t.toBase tb " +
           "WHERE t.fromBase.id = :baseId AND t.equipmentType.id = :equipmentTypeId AND t.status IN ('APPROVED', 'IN_TRANSIT', 'RECEIVED') AND t.transferDate BETWEEN :startDate AND :endDate ORDER BY t.transferDate DESC")
    List<TransferSummary> findSentSummaryByBaseIdAndEquipmentTypeIdAndDateRange(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("""
    SELECT t
    FROM Transfer t
    LEFT JOIN FETCH t.fromBase
    LEFT JOIN FETCH t.toBase
    LEFT JOIN FETCH t.equipmentType
    LEFT JOIN FETCH t.requestedBy
    LEFT JOIN FETCH t.approvedBy
    LEFT JOIN FETCH t.receivedBy
    LEFT JOIN FETCH t.cancelledBy
    WHERE (t.fromBase.id = :userBaseId OR t.toBase.id = :userBaseId)
    AND (:fromBaseId IS NULL OR t.fromBase.id = :fromBaseId)
    AND (:toBaseId IS NULL OR t.toBase.id = :toBaseId)
    AND (:equipmentTypeId IS NULL OR t.equipmentType.id = :equipmentTypeId)
    AND (:status IS NULL OR t.status = :status)
    AND (:startDate IS NULL OR t.transferDate >= :startDate)
    AND (:endDate IS NULL OR t.transferDate <= :endDate)
    ORDER BY t.transferDate DESC
    """)
Page<Transfer> findWithFiltersForUserBase(
        @Param("userBaseId") Long userBaseId,
        @Param("fromBaseId") Long fromBaseId,
        @Param("toBaseId") Long toBaseId,
        @Param("equipmentTypeId") Long equipmentTypeId,
        @Param("status") Transfer.Status status,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable);
}