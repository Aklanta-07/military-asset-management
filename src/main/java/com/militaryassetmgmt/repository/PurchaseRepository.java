package com.militaryassetmgmt.repository;

import com.militaryassetmgmt.entity.Purchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.militaryassetmgmt.dto.response.PurchaseSummary;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    @Query("SELECT p FROM Purchase p WHERE p.base.id = :baseId")
    List<Purchase> findByBaseId(@Param("baseId") Long baseId);

    @Query("SELECT p FROM Purchase p WHERE p.equipmentType.id = :equipmentTypeId")
    List<Purchase> findByEquipmentTypeId(@Param("equipmentTypeId") Long equipmentTypeId);

    @Query("SELECT p FROM Purchase p WHERE p.base.id = :baseId AND p.equipmentType.id = :equipmentTypeId")
    List<Purchase> findByBaseIdAndEquipmentTypeId(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId);

    @Query("SELECT p FROM Purchase p WHERE p.base.id = :baseId AND p.purchaseDate BETWEEN :startDate AND :endDate ORDER BY p.purchaseDate DESC")
    List<Purchase> findByBaseIdAndDateRange(@Param("baseId") Long baseId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT p FROM Purchase p WHERE p.equipmentType.id = :equipmentTypeId AND p.purchaseDate BETWEEN :startDate AND :endDate ORDER BY p.purchaseDate DESC")
    List<Purchase> findByEquipmentTypeIdAndDateRange(@Param("equipmentTypeId") Long equipmentTypeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT p FROM Purchase p WHERE p.base.id = :baseId AND p.equipmentType.id = :equipmentTypeId AND p.purchaseDate BETWEEN :startDate AND :endDate ORDER BY p.purchaseDate DESC")
    List<Purchase> findByBaseIdAndEquipmentTypeIdAndDateRange(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("""
    SELECT p
    FROM Purchase p
    WHERE (:baseId IS NULL OR p.base.id = :baseId)
    AND (:equipmentTypeId IS NULL OR p.equipmentType.id = :equipmentTypeId)
    AND (:startDate IS NULL OR p.purchaseDate >= :startDate)
    AND (:endDate IS NULL OR p.purchaseDate <= :endDate)
    """)
    Page<Purchase> findWithFilters(
        @Param("baseId") Long baseId,
        @Param("equipmentTypeId") Long equipmentTypeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.quantity), 0) FROM Purchase p WHERE p.base.id = :baseId AND p.equipmentType.id = :equipmentTypeId AND p.status = 'COMPLETED' AND p.purchaseDate BETWEEN :startDate AND :endDate")
    Long sumQuantityByBaseAndEquipmentTypeAndDateRange(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(p.quantity), 0) FROM Purchase p WHERE (:baseId IS NULL OR p.base.id = :baseId) AND p.status = 'COMPLETED' AND p.purchaseDate BETWEEN :startDate AND :endDate")
    Long sumQuantityByDateRange(@Param("baseId") Long baseId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(p.quantity), 0) FROM Purchase p WHERE p.base.id = :baseId AND p.status = 'COMPLETED' AND p.purchaseDate BETWEEN :startDate AND :endDate")
    Long sumQuantityByBaseIdAndDateRange(@Param("baseId") Long baseId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(p.totalCost), 0) FROM Purchase p WHERE (:baseId IS NULL OR p.base.id = :baseId) AND p.status = 'COMPLETED' AND p.purchaseDate BETWEEN :startDate AND :endDate")
    BigDecimal sumTotalCostByDateRange(@Param("baseId") Long baseId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(p.totalCost), 0) FROM Purchase p WHERE p.base.id = :baseId AND p.status = 'COMPLETED' AND p.purchaseDate BETWEEN :startDate AND :endDate")
    BigDecimal sumTotalCostByBaseIdAndDateRange(@Param("baseId") Long baseId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT new com.militaryassetmgmt.dto.response.PurchaseSummary(p.id, p.quantity, p.unitCost, p.totalCost, p.purchaseDate, p.supplier, p.invoiceReference) " +
           "FROM Purchase p WHERE p.equipmentType.id = :equipmentTypeId AND p.status = 'COMPLETED' AND p.purchaseDate BETWEEN :startDate AND :endDate ORDER BY p.purchaseDate DESC")
    List<PurchaseSummary> findSummaryByEquipmentTypeIdAndDateRange(@Param("equipmentTypeId") Long equipmentTypeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT new com.militaryassetmgmt.dto.response.PurchaseSummary(p.id, p.quantity, p.unitCost, p.totalCost, p.purchaseDate, p.supplier, p.invoiceReference) " +
           "FROM Purchase p WHERE p.base.id = :baseId AND p.equipmentType.id = :equipmentTypeId AND p.status = 'COMPLETED' AND p.purchaseDate BETWEEN :startDate AND :endDate ORDER BY p.purchaseDate DESC")
    List<PurchaseSummary> findSummaryByBaseIdAndEquipmentTypeIdAndDateRange(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

}