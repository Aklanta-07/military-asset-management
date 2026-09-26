package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.response.DashboardSummary;
import com.militaryassetmgmt.dto.response.NetMovementDetail;

import java.time.LocalDate;
import java.util.List;

/**
 * Service interface for retrieving dashboard analytics and net movement reports.
 */
public interface IDashboardService {

    DashboardSummary getDashboardSummary(Long baseId, LocalDate startDate, LocalDate endDate);

    DashboardSummary getDashboardSummary(Long baseId, Long equipmentTypeId, LocalDate startDate, LocalDate endDate);

    List<NetMovementDetail> getNetMovementDetail(Long baseId, LocalDate startDate, LocalDate endDate);

    List<NetMovementDetail> getNetMovementDetail(Long baseId, Long equipmentTypeId, LocalDate startDate, LocalDate endDate);
}
