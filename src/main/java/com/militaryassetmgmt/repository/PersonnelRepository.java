package com.militaryassetmgmt.repository;

import com.militaryassetmgmt.entity.Personnel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PersonnelRepository extends JpaRepository<Personnel, Long> {

    Optional<Personnel> findByServiceNumber(String serviceNumber);

    boolean existsByServiceNumber(String serviceNumber);

    @Query("SELECT p FROM Personnel p WHERE p.base.id = :baseId")
    List<Personnel> findByBaseId(@Param("baseId") Long baseId);

    @Query("SELECT p FROM Personnel p WHERE p.active = 1")
    List<Personnel> findByActiveTrue();

    @Query("SELECT p FROM Personnel p WHERE p.base.id = :baseId AND p.active = 1 ORDER BY p.rank, p.fullName")
    List<Personnel> findActiveByBaseIdOrderByRank(@Param("baseId") Long baseId);
}