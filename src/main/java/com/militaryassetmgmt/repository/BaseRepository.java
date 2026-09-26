package com.militaryassetmgmt.repository;

import com.militaryassetmgmt.entity.Base;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BaseRepository extends JpaRepository<Base, Long> {

    Optional<Base> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT b FROM Base b WHERE b.active = 1")
    List<Base> findByActiveTrue();

    @Query("SELECT b FROM Base b WHERE b.active = 1 AND b.commander.id = :commanderId")
    Optional<Base> findByCommanderId(@Param("commanderId") Long commanderId);
}