package com.militaryassetmgmt.controller;

import com.militaryassetmgmt.dto.request.PurchaseRequest;
import com.militaryassetmgmt.dto.response.PurchaseResponse;
import com.militaryassetmgmt.entity.User;
import com.militaryassetmgmt.service.IPurchaseService;
import com.militaryassetmgmt.service.IUserService;
import com.militaryassetmgmt.util.ApiResponse;
import com.militaryassetmgmt.util.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
@Tag(name = "Purchases", description = "Asset purchase and procurement endpoints")
public class PurchaseController {

    private final IPurchaseService purchaseService;
    private final IUserService userService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
    @Operation(summary = "Record new purchase", description = "Record asset procurement for a base, automatically creating asset instances")
    public ResponseEntity<ApiResponse<PurchaseResponse>> createPurchase(
            @Valid @RequestBody PurchaseRequest request,
            Authentication authentication) {
        PurchaseResponse response = purchaseService.createPurchase(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Purchase recorded successfully", response));
    }

    @GetMapping
    @Operation(summary = "List purchases with filters", description = "View historical purchases filtered by base, equipment type, and date range")
    public ResponseEntity<ApiResponse<PageResponse<PurchaseResponse>>> getPurchases(
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) Long equipmentTypeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "purchaseDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            Authentication authentication) {

        Long effectiveBaseId = resolveEffectiveBaseId(baseId, authentication);
        PageResponse<PurchaseResponse> response = purchaseService.getPurchases(
                effectiveBaseId, equipmentTypeId, startDate, endDate, page, size, sortBy, sortDir
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get purchase by ID")
    public ResponseEntity<ApiResponse<PurchaseResponse>> getPurchaseById(@PathVariable Long id) {
        PurchaseResponse response = purchaseService.getPurchaseById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    @Operation(summary = "Update pending purchase")
    public ResponseEntity<ApiResponse<PurchaseResponse>> updatePurchase(
            @PathVariable Long id,
            @Valid @RequestBody PurchaseRequest request) {
        PurchaseResponse response = purchaseService.updatePurchase(id, request);
        return ResponseEntity.ok(ApiResponse.success("Purchase updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete pending purchase")
    public ResponseEntity<ApiResponse<Void>> deletePurchase(@PathVariable Long id) {
        purchaseService.deletePurchase(id);
        return ResponseEntity.ok(ApiResponse.success("Purchase deleted successfully", null));
    }

    private Long resolveEffectiveBaseId(Long requestedBaseId, Authentication authentication) {
        if (authentication == null) {
            return requestedBaseId;
        }
        User user = userService.findByUsername(authentication.getName()).orElse(null);
        if (user == null || user.isAdmin()) {
            return requestedBaseId;
        }
        return user.getBaseId();
    }
}
