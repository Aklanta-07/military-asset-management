package com.militaryassetmgmt.controller;

import com.militaryassetmgmt.dto.request.PurchaseRequest;
import com.militaryassetmgmt.util.ApiResponse;
import com.militaryassetmgmt.util.PageResponse;
import com.militaryassetmgmt.dto.response.PurchaseResponse;
import com.militaryassetmgmt.service.PurchaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
public class PurchaseController {

    private final PurchaseService purchaseService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
    public ApiResponse<PurchaseResponse> createPurchase(
            @Valid @RequestBody PurchaseRequest request,
            Authentication authentication) {
        PurchaseResponse response = purchaseService.createPurchase(request, authentication.getName());
        return ApiResponse.success("Purchase created successfully", response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
    public ApiResponse<PageResponse<PurchaseResponse>> getPurchases(
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) Long equipmentTypeId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "purchaseDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            Authentication authentication) {

        PageResponse<PurchaseResponse> response = purchaseService.getPurchases(
                baseId, equipmentTypeId, startDate, endDate, page, size, sortBy, sortDir, authentication.getName());
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
    public ApiResponse<PurchaseResponse> getPurchaseById(
            @PathVariable Long id,
            Authentication authentication) {
        PurchaseResponse response = purchaseService.getPurchaseById(id, authentication.getName());
        return ApiResponse.success(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
    public ApiResponse<PurchaseResponse> updatePurchase(
            @PathVariable Long id,
            @Valid @RequestBody PurchaseRequest request,
            Authentication authentication) {
        PurchaseResponse response = purchaseService.updatePurchase(id, request, authentication.getName());
        return ApiResponse.success("Purchase updated successfully", response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
    public ApiResponse<String> deletePurchase(
            @PathVariable Long id,
            Authentication authentication) {
        purchaseService.deletePurchase(id, authentication.getName());
        return ApiResponse.success("Purchase deleted successfully");
    }

}