package com.militaryassetmgmt.repository;

import com.militaryassetmgmt.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    Optional<Asset> findBySerialNumber(String serialNumber);

    boolean existsBySerialNumber(String serialNumber);

    @Query("SELECT a FROM Asset a WHERE a.base.id = :baseId")
    List<Asset> findByBaseId(@Param("baseId") Long baseId);

    @Query("SELECT a FROM Asset a WHERE a.equipmentType.id = :equipmentTypeId")
    List<Asset> findByEquipmentTypeId(@Param("equipmentTypeId") Long equipmentTypeId);

    @Query("SELECT a FROM Asset a WHERE a.base.id = :baseId AND a.equipmentType.id = :equipmentTypeId")
    List<Asset> findByBaseIdAndEquipmentTypeId(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId);

    List<Asset> findByStatus(Asset.Status status);

    @Query("SELECT a FROM Asset a WHERE a.base.id = :baseId AND a.equipmentType.id = :equipmentTypeId AND a.active = 1 AND a.status NOT IN ('EXPENDED', 'DISPOSED')")
    List<Asset> findAvailableByBaseAndEquipmentType(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId);

    @Query("SELECT COUNT(a) FROM Asset a WHERE a.base.id = :baseId AND a.equipmentType.id = :equipmentTypeId AND a.active = 1 AND a.status NOT IN ('EXPENDED', 'DISPOSED')")
    Long countAvailableByBaseAndEquipmentType(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId);

    @Query("SELECT COUNT(a) FROM Asset a WHERE a.base.id = :baseId AND a.equipmentType.id = :equipmentTypeId AND a.active = 1 AND a.status = 'ASSIGNED'")
    Long countAssignedByBaseAndEquipmentType(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId);

    @Query("SELECT COUNT(a) FROM Asset a WHERE (:baseId IS NULL OR a.base.id = :baseId) AND a.acquiredDate < :date")
    Long countByAcquiredDateBefore(@Param("baseId") Long baseId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(a) FROM Asset a WHERE a.base.id = :baseId AND a.acquiredDate < :date")
    Long countByBaseIdAndAcquiredDateBefore(@Param("baseId") Long baseId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(a) FROM Asset a WHERE a.equipmentType.id = :equipmentTypeId AND a.acquiredDate < :date")
    Long countByEquipmentTypeIdAndAcquiredDateBefore(@Param("equipmentTypeId") Long equipmentTypeId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(a) FROM Asset a WHERE a.base.id = :baseId AND a.equipmentType.id = :equipmentTypeId AND a.acquiredDate < :date")
    Long countByBaseIdAndEquipmentTypeIdAndAcquiredDateBefore(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId, @Param("date") LocalDate date);

    @Query("SELECT a FROM Asset a WHERE (:baseId IS NULL OR a.base.id = :baseId) AND (:equipmentTypeId IS NULL OR a.equipmentType.id = :equipmentTypeId) AND (:status IS NULL OR a.status = :status) ORDER BY a.serialNumber ASC")
    org.springframework.data.domain.Page<Asset> findWithFilters(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId, @Param("status") Asset.Status status, org.springframework.data.domain.Pageable pageable);
}