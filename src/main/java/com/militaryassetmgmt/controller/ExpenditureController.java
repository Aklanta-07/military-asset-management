package com.militaryassetmgmt.controller;

import com.militaryassetmgmt.dto.request.ExpenditureRequest;
import com.militaryassetmgmt.util.ApiResponse;
import com.militaryassetmgmt.util.PageResponse;
import com.militaryassetmgmt.dto.response.ExpenditureResponse;
import com.militaryassetmgmt.service.ExpenditureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/expenditures")
@RequiredArgsConstructor
public class ExpenditureController {

    private final ExpenditureService expenditureService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    public ApiResponse<ExpenditureResponse> createExpenditure(
            @Valid @RequestBody ExpenditureRequest request,
            Authentication authentication) {
        ExpenditureResponse response = expenditureService.createExpenditure(request, authentication.getName());
        return ApiResponse.success("Expenditure recorded successfully", response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    public ApiResponse<PageResponse<ExpenditureResponse>> getExpenditures(
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) Long equipmentTypeId,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "expenditureDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            Authentication authentication) {

        PageResponse<ExpenditureResponse> response = expenditureService.getExpenditures(
                baseId, equipmentTypeId, reason, startDate, endDate, page, size, sortBy, sortDir, authentication.getName());
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    public ApiResponse<ExpenditureResponse> getExpenditureById(
            @PathVariable Long id,
            Authentication authentication) {
        ExpenditureResponse response = expenditureService.getExpenditureById(id, authentication.getName());
        return ApiResponse.success(response);
    }
}