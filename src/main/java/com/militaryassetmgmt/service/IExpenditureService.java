package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.request.ExpenditureRequest;
import com.militaryassetmgmt.dto.response.ExpenditureResponse;
import com.militaryassetmgmt.util.PageResponse;

import java.time.LocalDate;

public interface IExpenditureService {

    ExpenditureResponse createExpenditure(ExpenditureRequest request, String username);

    PageResponse<ExpenditureResponse> getExpenditures(Long baseId, Long equipmentTypeId, String reason,
            LocalDate startDate, LocalDate endDate, int page, int size, String sortBy, String sortDir, String username);

    ExpenditureResponse getExpenditureById(Long id, String username);
}
