package com.militaryassetmgmt.repository;

import com.militaryassetmgmt.entity.EquipmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EquipmentTypeRepository extends JpaRepository<EquipmentType, Long> {

    Optional<EquipmentType> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT et FROM EquipmentType et WHERE et.active = 1")
    List<EquipmentType> findByActiveTrue();

    List<EquipmentType> findByCategory(String category);

    @Query("SELECT et FROM EquipmentType et WHERE et.active = 1 AND et.category = :category ORDER BY et.name")
    List<EquipmentType> findActiveByCategory(@Param("category") String category);
}