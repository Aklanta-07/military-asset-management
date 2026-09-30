package com.militaryassetmgmt.controller;

import com.militaryassetmgmt.dto.request.AssignmentRequest;
import com.militaryassetmgmt.util.ApiResponse;
import com.militaryassetmgmt.dto.response.AssignmentResponse;
import com.militaryassetmgmt.entity.Assignment;
import com.militaryassetmgmt.util.PageResponse;
import com.militaryassetmgmt.service.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    public ApiResponse<AssignmentResponse> createAssignment(
            @Valid @RequestBody AssignmentRequest request,
            Authentication authentication) {
        AssignmentResponse response = assignmentService.createAssignment(request, authentication.getName());
        return ApiResponse.success("Asset assigned successfully", response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    public ApiResponse<PageResponse<AssignmentResponse>> getAssignments(
            @RequestParam(required = false) Long assetId,
            @RequestParam(required = false) Long personnelId,
            @RequestParam(required = false) Assignment.Status status,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "assignedDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            Authentication authentication) {

        PageResponse<AssignmentResponse> response = assignmentService.getAssignments(
                assetId, personnelId, status, startDate, endDate, page, size, sortBy, sortDir, authentication.getName());
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    public ApiResponse<AssignmentResponse> getAssignmentById(
            @PathVariable Long id,
            Authentication authentication) {
        AssignmentResponse response = assignmentService.getAssignmentById(id, authentication.getName());
        return ApiResponse.success(response);
    }

    @PostMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    public ApiResponse<AssignmentResponse> returnAsset(
            @PathVariable Long id,
            @RequestParam LocalDate returnedDate,
            Authentication authentication) {
        AssignmentResponse response = assignmentService.returnAsset(id, returnedDate, authentication.getName());
        return ApiResponse.success("Asset returned successfully", response);
    }
}