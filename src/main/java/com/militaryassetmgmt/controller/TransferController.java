package com.militaryassetmgmt.controller;

import com.militaryassetmgmt.dto.request.TransferRequest;
import com.militaryassetmgmt.util.ApiResponse;
import com.militaryassetmgmt.util.PageResponse;
import com.militaryassetmgmt.dto.response.TransferResponse;
import com.militaryassetmgmt.service.TransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
    public ApiResponse<TransferResponse> createTransfer(
            @Valid @RequestBody TransferRequest request,
            Authentication authentication) {
        TransferResponse response = transferService.createTransfer(request, authentication.getName());
        return ApiResponse.success("Transfer initiated successfully", response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
    public ApiResponse<PageResponse<TransferResponse>> getTransfers(
            @RequestParam(required = false) Long fromBaseId,
            @RequestParam(required = false) Long toBaseId,
            @RequestParam(required = false) Long equipmentTypeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "transferDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            Authentication authentication) {

        PageResponse<TransferResponse> response = transferService.getTransfers(
                fromBaseId, toBaseId, equipmentTypeId, status,
                startDate, endDate, page, size, sortBy, sortDir, authentication.getName());
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
    public ApiResponse<TransferResponse> getTransferById(
            @PathVariable Long id,
            Authentication authentication) {
        TransferResponse response = transferService.getTransferById(id, authentication.getName());
        return ApiResponse.success(response);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    public ApiResponse<TransferResponse> approveTransfer(
            @PathVariable Long id,
            Authentication authentication) {
        TransferResponse response = transferService.approveTransfer(id, authentication.getName());
        return ApiResponse.success("Transfer approved successfully", response);
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    public ApiResponse<TransferResponse> receiveTransfer(
            @PathVariable Long id,
            Authentication authentication) {
        TransferResponse response = transferService.receiveTransfer(id, authentication.getName());
        return ApiResponse.success("Transfer received successfully", response);
    }

    @PostMapping("/{id}/in-transit")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    public ApiResponse<TransferResponse> markInTransit(
            @PathVariable Long id,
            Authentication authentication) {
        TransferResponse response = transferService.markInTransit(id, authentication.getName());
        return ApiResponse.success("Transfer marked as in transit", response);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
    public ApiResponse<TransferResponse> cancelTransfer(
            @PathVariable Long id,
            @RequestParam String reason,
            Authentication authentication) {
        TransferResponse response = transferService.cancelTransfer(id, reason, authentication.getName());
        return ApiResponse.success("Transfer cancelled successfully", response);
    }
}