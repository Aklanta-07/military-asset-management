package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.request.PurchaseRequest;
import com.militaryassetmgmt.util.PageResponse;
import com.militaryassetmgmt.dto.response.PurchaseResponse;
import com.militaryassetmgmt.entity.Asset;
import com.militaryassetmgmt.entity.Base;
import com.militaryassetmgmt.entity.EquipmentType;
import com.militaryassetmgmt.entity.Purchase;
import com.militaryassetmgmt.entity.User;
import com.militaryassetmgmt.exception.BusinessRuleViolationException;
import com.militaryassetmgmt.exception.ResourceNotFoundException;
import com.militaryassetmgmt.repository.AssetRepository;
import com.militaryassetmgmt.repository.BaseRepository;
import com.militaryassetmgmt.repository.EquipmentTypeRepository;
import com.militaryassetmgmt.repository.PurchaseRepository;
import com.militaryassetmgmt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class PurchaseService implements IPurchaseService {

    /** Equipment categories considered bulk/consumable — do NOT create per-unit asset rows */
    private static final Set<String> BULK_CATEGORIES = Set.of("AMMUNITION");

    private final PurchaseRepository purchaseRepository;
    private final BaseRepository baseRepository;
    private final EquipmentTypeRepository equipmentTypeRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public PurchaseResponse createPurchase(PurchaseRequest request, String username) {
        Base base = baseRepository.findById(request.getBaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Base not found with id: " + request.getBaseId()));

        EquipmentType equipmentType = equipmentTypeRepository.findById(request.getEquipmentTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment type not found with id: " + request.getEquipmentTypeId()));

        User createdByUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        // Enforce base-scoped access: LOGISTICS_OFFICER and BASE_COMMANDER must use their own base
        if (!createdByUser.isAdmin()) {
            Long userBaseId = createdByUser.getBaseId();
            if (userBaseId == null || !userBaseId.equals(request.getBaseId())) {
                throw new AccessDeniedException("You can only create purchases for your assigned base.");
            }
        }

        BigDecimal totalCost = request.getUnitCost().multiply(BigDecimal.valueOf(request.getQuantity()));

        Purchase purchase = Purchase.builder()
                .base(base)
                .equipmentType(equipmentType)
                .quantity(request.getQuantity())
                .unitCost(request.getUnitCost())
                .totalCost(totalCost)
                .purchaseDate(request.getPurchaseDate())
                .supplier(request.getSupplier())
                .invoiceReference(request.getInvoiceReference())
                .description(request.getDescription())
                .status(Purchase.Status.COMPLETED)
                .createdByUser(createdByUser)
                .build();

        Purchase savedPurchase = purchaseRepository.save(purchase);

        // Create individual asset records for non-bulk equipment types
        boolean isBulk = BULK_CATEGORIES.contains(equipmentType.getCategory());
        if (!isBulk) {
            for (int i = 0; i < request.getQuantity(); i++) {
                Asset asset = Asset.builder()
                        .base(base)
                        .equipmentType(equipmentType)
                        .serialNumber(generateSerialNumber(equipmentType.getCode(), base.getCode()))
                        .status(Asset.Status.AVAILABLE)
                        .condition(Asset.Condition.SERVICEABLE)
                        .acquiredDate(request.getPurchaseDate())
                        .acquisitionValue(request.getUnitCost())
                        .currentValue(request.getUnitCost())
                        .active(1)
                        .build();
                assetRepository.save(asset);
            }
        }

        log.info("Purchase created id={} by={} base={} qty={}", savedPurchase.getId(), username, base.getCode(), request.getQuantity());
        return mapToResponse(savedPurchase);
    }

    @Override	
    @Transactional(readOnly = true)
    public PageResponse<PurchaseResponse> getPurchases(Long baseId, Long equipmentTypeId,
                                                        LocalDate startDate, LocalDate endDate,
                                                        int page, int size, String sortBy, String sortDir, String username) {
        User user = userRepository.findByUsername(username)
                   .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        
        Long effectiveBaseId = user.isAdmin()
            ? baseId
            : user.getBaseId();

        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Purchase> purchasePage = purchaseRepository.findWithFilters(effectiveBaseId, equipmentTypeId, startDate, endDate, pageable);
        return PageResponse.of(purchasePage.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseResponse getPurchaseById(Long id, String username) {
        User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found with id: " + id));

    
        if (!user.isAdmin()
        && !Objects.equals(user.getBaseId(), purchase.getBase().getId())) {
            throw new AccessDeniedException(
                    "You can only access purchases for your assigned base."
            );
        }

        return mapToResponse(purchase);
    }

    @Override
    @Transactional
    public PurchaseResponse updatePurchase(Long id, PurchaseRequest request, String username) {
        User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found with id: " + id));

        if(!user.isAdmin() && !Objects.equals(user.getBaseId(), purchase.getBase().getId())) {
             throw new AccessDeniedException(
                    "You can only access purchases for your assigned base."
            );
        }

        if(!user.isAdmin() && !Objects.equals(user.getBaseId(), request.getBaseId())) {
            throw new AccessDeniedException("You can only update purchases for your assigned base.");
        }

        if (purchase.getStatus() != Purchase.Status.PENDING) {
            throw new BusinessRuleViolationException("Cannot update purchase with status: " + purchase.getStatus());
        }

        Base base = baseRepository.findById(request.getBaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Base not found with id: " + request.getBaseId()));

        EquipmentType equipmentType = equipmentTypeRepository.findById(request.getEquipmentTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment type not found with id: " + request.getEquipmentTypeId()));

        BigDecimal totalCost = request.getUnitCost().multiply(BigDecimal.valueOf(request.getQuantity()));

        purchase.setBase(base);
        purchase.setEquipmentType(equipmentType);
        purchase.setQuantity(request.getQuantity());
        purchase.setUnitCost(request.getUnitCost());
        purchase.setTotalCost(totalCost);
        purchase.setPurchaseDate(request.getPurchaseDate());
        purchase.setSupplier(request.getSupplier());
        purchase.setInvoiceReference(request.getInvoiceReference());

        Purchase savedPurchase = purchaseRepository.save(purchase);
        return mapToResponse(savedPurchase);
    }

    @Override
    @Transactional
    public void deletePurchase(Long id, String username) {
        User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found with id: " + id));

        if(!user.isAdmin() && !Objects.equals(user.getBaseId(), purchase.getBase().getId())) {
            throw new AccessDeniedException("You can only delete purchases for your assigned base.");
        }

        if (purchase.getStatus() != Purchase.Status.PENDING) {
            throw new BusinessRuleViolationException("Cannot delete purchase with status: " + purchase.getStatus());
        }

        purchaseRepository.delete(purchase);
    }

    private String generateSerialNumber(String equipmentCode, String baseCode) {
        long count = assetRepository.count() + 1;
        return String.format("%s-%s-%06d", equipmentCode, baseCode, count);
    }

    private PurchaseResponse mapToResponse(Purchase purchase) {
        return PurchaseResponse.builder()
                .id(purchase.getId())
                .baseId(purchase.getBase().getId())
                .baseCode(purchase.getBase().getCode())
                .baseName(purchase.getBase().getName())
                .equipmentTypeId(purchase.getEquipmentType().getId())
                .equipmentTypeCode(purchase.getEquipmentType().getCode())
                .equipmentTypeName(purchase.getEquipmentType().getName())
                .quantity(purchase.getQuantity())
                .unitCost(purchase.getUnitCost())
                .totalCost(purchase.getTotalCost())
                .purchaseDate(purchase.getPurchaseDate())
                .supplier(purchase.getSupplier())
                .invoiceReference(purchase.getInvoiceReference())
                .status(purchase.getStatus().name())
                .createdBy(purchase.getCreatedByUser() != null ? purchase.getCreatedByUser().getId() : null)
                .createdByName(purchase.getCreatedByUser() != null ? purchase.getCreatedByUser().getFullName() : null)
                .createdAt(purchase.getCreatedAt())
                .updatedAt(purchase.getUpdatedAt())
                .build();
    }
}