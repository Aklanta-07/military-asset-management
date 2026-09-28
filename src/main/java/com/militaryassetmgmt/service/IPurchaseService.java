package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.request.PurchaseRequest;
import com.militaryassetmgmt.dto.response.PurchaseResponse;
import com.militaryassetmgmt.util.PageResponse;

import java.time.LocalDate;

/**
 * Service interface for managing equipment purchase records and inventory creation.
 */
public interface IPurchaseService {

    PurchaseResponse createPurchase(PurchaseRequest request, String username);

    PageResponse<PurchaseResponse> getPurchases(Long baseId, Long equipmentTypeId,
                                                LocalDate startDate, LocalDate endDate,
                                                int page, int size, String sortBy, String sortDir, String username);

    PurchaseResponse getPurchaseById(Long id, String username);

    PurchaseResponse updatePurchase(Long id, PurchaseRequest request, String username);

    void deletePurchase(Long id, String username);
}
