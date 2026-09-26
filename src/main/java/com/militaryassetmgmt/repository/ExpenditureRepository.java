package com.militaryassetmgmt.repository;

import com.militaryassetmgmt.entity.Expenditure;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ExpenditureRepository extends JpaRepository<Expenditure, Long> {

    @Query("SELECT e FROM Expenditure e WHERE e.base.id = :baseId")
    List<Expenditure> findByBaseId(@Param("baseId") Long baseId);

    @Query("SELECT e FROM Expenditure e WHERE e.equipmentType.id = :equipmentTypeId")
    List<Expenditure> findByEquipmentTypeId(@Param("equipmentTypeId") Long equipmentTypeId);

    List<Expenditure> findByReason(String reason);

    @Query("SELECT e FROM Expenditure e WHERE e.base.id = :baseId AND e.expenditureDate BETWEEN :startDate AND :endDate ORDER BY e.expenditureDate DESC")
    List<Expenditure> findByBaseIdAndDateRange(@Param("baseId") Long baseId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT e FROM Expenditure e WHERE e.equipmentType.id = :equipmentTypeId AND e.expenditureDate BETWEEN :startDate AND :endDate ORDER BY e.expenditureDate DESC")
    List<Expenditure> findByEquipmentTypeIdAndDateRange(@Param("equipmentTypeId") Long equipmentTypeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT e FROM Expenditure e WHERE (:baseId IS NULL OR e.base.id = :baseId) AND (:equipmentTypeId IS NULL OR e.equipmentType.id = :equipmentTypeId) AND (:reason IS NULL OR e.reason = :reason) AND (:startDate IS NULL OR e.expenditureDate >= :startDate) AND (:endDate IS NULL OR e.expenditureDate <= :endDate) ORDER BY e.expenditureDate DESC")
    Page<Expenditure> findWithFilters(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId, @Param("reason") String reason, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);

    @Query("SELECT COALESCE(SUM(e.quantity), 0) FROM Expenditure e WHERE e.base.id = :baseId AND e.equipmentType.id = :equipmentTypeId AND e.expenditureDate BETWEEN :startDate AND :endDate")
    Long sumQuantityByBaseAndEquipmentTypeAndDateRange(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(e.quantity), 0) FROM Expenditure e WHERE (:baseId IS NULL OR e.base.id = :baseId) AND e.expenditureDate BETWEEN :startDate AND :endDate")
    Long sumQuantityByDateRange(@Param("baseId") Long baseId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(e.quantity), 0) FROM Expenditure e WHERE e.base.id = :baseId AND e.expenditureDate BETWEEN :startDate AND :endDate")
    Long sumQuantityByBaseIdAndDateRange(@Param("baseId") Long baseId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}