package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.request.AssignmentRequest;
import com.militaryassetmgmt.dto.response.AssignmentResponse;
import com.militaryassetmgmt.util.PageResponse;

import java.time.LocalDate;

public interface IAssignmentService {

    AssignmentResponse createAssignment(AssignmentRequest request, String username);

    PageResponse<AssignmentResponse> getAssignments(Long assetId, Long personnelId, String status,
            LocalDate startDate, LocalDate endDate,
            int page, int size, String sortBy, String sortDir, String username);

    AssignmentResponse getAssignmentById(Long id, String username);

    AssignmentResponse returnAsset(Long id, LocalDate returnedDate, String username);
}
