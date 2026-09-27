package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.response.DashboardSummary;
import com.militaryassetmgmt.dto.response.NetMovementDetail;
import com.militaryassetmgmt.entity.Base;
import com.militaryassetmgmt.entity.EquipmentType;
import com.militaryassetmgmt.repository.AssetRepository;
import com.militaryassetmgmt.repository.AssignmentRepository;
import com.militaryassetmgmt.repository.BaseRepository;
import com.militaryassetmgmt.repository.EquipmentTypeRepository;
import com.militaryassetmgmt.repository.ExpenditureRepository;
import com.militaryassetmgmt.repository.PurchaseRepository;
import com.militaryassetmgmt.repository.TransferRepository;
import com.militaryassetmgmt.dto.response.PurchaseSummary;
import com.militaryassetmgmt.dto.response.TransferSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService implements IDashboardService {

    private final AssetRepository assetRepository;
    private final PurchaseRepository purchaseRepository;
    private final TransferRepository transferRepository;
    private final AssignmentRepository assignmentRepository;
    private final ExpenditureRepository expenditureRepository;
    private final BaseRepository baseRepository;
    private final EquipmentTypeRepository equipmentTypeRepository;

    @Override
    public DashboardSummary getDashboardSummary(Long baseId, LocalDate startDate, LocalDate endDate) {
        return getDashboardSummary(baseId, null, startDate, endDate);
    }

    @Override
    public DashboardSummary getDashboardSummary(Long baseId, Long equipmentTypeId, LocalDate startDate, LocalDate endDate) {
        if (equipmentTypeId != null) {
            return getEquipmentTypeDashboardSummary(baseId, equipmentTypeId, startDate, endDate);
        }
        if (baseId == null) {
            return getGlobalDashboardSummary(startDate, endDate);
        }
        return getBaseDashboardSummary(baseId, startDate, endDate);
    }

    private DashboardSummary getGlobalDashboardSummary(LocalDate startDate, LocalDate endDate) {
        Long openingBalance = assetRepository.countByAcquiredDateBefore(null, startDate);
        Long purchasesQty = purchaseRepository.sumQuantityByDateRange(null, startDate, endDate);
        BigDecimal purchasesValue = purchaseRepository.sumTotalCostByDateRange(null, startDate, endDate);
        Long transfersInQty = transferRepository.sumQuantityReceivedByDateRange(null, startDate, endDate);
        Long transfersOutQty = transferRepository.sumQuantitySentByDateRange(null, startDate, endDate);
        Long assignedQty = assignmentRepository.countActiveAssignmentsByDateRange(null, startDate, endDate);
        Long expendedQty = expenditureRepository.sumQuantityByDateRange(null, startDate, endDate);
        Long closingBalance = assetRepository.countByAcquiredDateBefore(null, endDate.plusDays(1));

        // Net Movement = Purchases + Transfers In - Transfers Out
        Long netMovement = purchasesQty + transfersInQty - transfersOutQty;

        return DashboardSummary.builder()
                .baseName("All Bases")
                .equipmentTypesCount((int) equipmentTypeRepository.count())
                .openingBalance(openingBalance)
                .closingBalance(closingBalance)
                .purchasesQty(purchasesQty)
                .purchasesValue(purchasesValue)
                .transfersInQty(transfersInQty)
                .transfersOutQty(transfersOutQty)
                .netMovement(netMovement)
                .assignedQty(assignedQty)
                .expendedQty(expendedQty)
                .totalAssets(closingBalance)
                .totalPurchases(purchasesQty)
                .totalTransfersIn(transfersInQty)
                .totalTransfersOut(transfersOutQty)
                .totalAssigned(assignedQty)
                .totalExpended(expendedQty)
                .build();
    }

    private DashboardSummary getBaseDashboardSummary(Long baseId, LocalDate startDate, LocalDate endDate) {
        Base base = baseRepository.findById(baseId).orElse(null);
        String baseCode = base != null ? base.getCode() : null;
        String baseName = base != null ? base.getName() : null;

        Long openingBalance = assetRepository.countByBaseIdAndAcquiredDateBefore(baseId, startDate);
        Long purchasesQty = purchaseRepository.sumQuantityByBaseIdAndDateRange(baseId, startDate, endDate);
        BigDecimal purchasesValue = purchaseRepository.sumTotalCostByBaseIdAndDateRange(baseId, startDate, endDate);
        Long transfersInQty = transferRepository.sumQuantityReceivedByBaseIdAndDateRange(baseId, startDate, endDate);
        Long transfersOutQty = transferRepository.sumQuantitySentByBaseIdAndDateRange(baseId, startDate, endDate);
        Long assignedQty = assignmentRepository.countActiveAssignmentsByBaseIdAndDateRange(baseId, startDate, endDate);
        Long expendedQty = expenditureRepository.sumQuantityByBaseIdAndDateRange(baseId, startDate, endDate);
        Long closingBalance = assetRepository.countByBaseIdAndAcquiredDateBefore(baseId, endDate.plusDays(1));

        // Net Movement = Purchases + Transfers In - Transfers Out
        Long netMovement = purchasesQty + transfersInQty - transfersOutQty;

        return DashboardSummary.builder()
                .baseId(baseId)
                .baseCode(baseCode)
                .baseName(baseName)
                .equipmentTypesCount((int) equipmentTypeRepository.count())
                .openingBalance(openingBalance)
                .closingBalance(closingBalance)
                .purchasesQty(purchasesQty)
                .purchasesValue(purchasesValue)
                .transfersInQty(transfersInQty)
                .transfersOutQty(transfersOutQty)
                .netMovement(netMovement)
                .assignedQty(assignedQty)
                .expendedQty(expendedQty)
                .totalAssets(closingBalance)
                .totalPurchases(purchasesQty)
                .totalTransfersIn(transfersInQty)
                .totalTransfersOut(transfersOutQty)
                .totalAssigned(assignedQty)
                .totalExpended(expendedQty)
                .build();
    }

    private DashboardSummary getEquipmentTypeDashboardSummary(Long baseId, Long equipmentTypeId, LocalDate startDate, LocalDate endDate) {
        Base base = baseId != null ? baseRepository.findById(baseId).orElse(null) : null;
        String baseCode = base != null ? base.getCode() : null;
        String baseName = base != null ? base.getName() : "All Bases";

        Long openingBalance = (baseId != null)
                ? assetRepository.countByBaseIdAndEquipmentTypeIdAndAcquiredDateBefore(baseId, equipmentTypeId, startDate)
                : assetRepository.countByEquipmentTypeIdAndAcquiredDateBefore(equipmentTypeId, startDate);

        Long purchasesQty = (baseId != null)
                ? purchaseRepository.sumQuantityByBaseAndEquipmentTypeAndDateRange(baseId, equipmentTypeId, startDate, endDate)
                : purchaseRepository.sumQuantityByDateRange(null, startDate, endDate);

        Long transfersInQty = (baseId != null)
                ? transferRepository.sumTransfersInByBaseAndEquipmentTypeAndDateRange(baseId, equipmentTypeId, startDate, endDate)
                : transferRepository.sumQuantityReceivedByDateRange(null, startDate, endDate);

        Long transfersOutQty = (baseId != null)
                ? transferRepository.sumTransfersOutByBaseAndEquipmentTypeAndDateRange(baseId, equipmentTypeId, startDate, endDate)
                : transferRepository.sumQuantitySentByDateRange(null, startDate, endDate);

        Long assignedQty = (baseId != null)
                ? assignmentRepository.countActiveByBaseAndEquipmentType(baseId, equipmentTypeId)
                : assignmentRepository.countActiveAssignmentsByDateRange(null, startDate, endDate);

        Long expendedQty = (baseId != null)
                ? expenditureRepository.sumQuantityByBaseAndEquipmentTypeAndDateRange(baseId, equipmentTypeId, startDate, endDate)
                : expenditureRepository.sumQuantityByDateRange(null, startDate, endDate);

        Long closingBalance = (baseId != null)
                ? assetRepository.countByBaseIdAndEquipmentTypeIdAndAcquiredDateBefore(baseId, equipmentTypeId, endDate.plusDays(1))
                : assetRepository.countByEquipmentTypeIdAndAcquiredDateBefore(equipmentTypeId, endDate.plusDays(1));

        Long netMovement = purchasesQty + transfersInQty - transfersOutQty;

        return DashboardSummary.builder()
                .baseId(baseId)
                .baseCode(baseCode)
                .baseName(baseName)
                .equipmentTypesCount(1)
                .openingBalance(openingBalance)
                .closingBalance(closingBalance)
                .purchasesQty(purchasesQty)
                .purchasesValue(BigDecimal.ZERO)
                .transfersInQty(transfersInQty)
                .transfersOutQty(transfersOutQty)
                .netMovement(netMovement)
                .assignedQty(assignedQty)
                .expendedQty(expendedQty)
                .totalAssets(closingBalance)
                .totalPurchases(purchasesQty)
                .totalTransfersIn(transfersInQty)
                .totalTransfersOut(transfersOutQty)
                .totalAssigned(assignedQty)
                .totalExpended(expendedQty)
                .build();
    }

    @Override
    public List<NetMovementDetail> getNetMovementDetail(Long baseId, LocalDate startDate, LocalDate endDate) {
        return getNetMovementDetail(baseId, null, startDate, endDate);
    }

    @Override
    public List<NetMovementDetail> getNetMovementDetail(Long baseId, Long equipmentTypeId, LocalDate startDate, LocalDate endDate) {
        List<EquipmentType> equipmentTypes;
        if (equipmentTypeId != null) {
            equipmentTypes = equipmentTypeRepository.findById(equipmentTypeId)
                    .map(List::of)
                    .orElse(List.of());
        } else {
            equipmentTypes = equipmentTypeRepository.findByActiveTrue();
        }

        List<NetMovementDetail> details = new ArrayList<>();
        for (EquipmentType equipmentType : equipmentTypes) {
            NetMovementDetail detail = buildNetMovementDetail(baseId, equipmentType, startDate, endDate);
            if (detail.getOpeningBalance() > 0 || detail.getPurchasesQty() > 0 ||
                    detail.getTransfersInQty() > 0 || detail.getTransfersOutQty() > 0 ||
                    detail.getNetMovement() != 0 || detail.getClosingBalance() > 0) {
                details.add(detail);
            }
        }

        return details;
    }

    private NetMovementDetail buildNetMovementDetail(Long baseId, EquipmentType equipmentType, LocalDate startDate, LocalDate endDate) {
        Long equipmentTypeId = equipmentType.getId();

        Long openingBalance = (baseId != null)
                ? assetRepository.countByBaseIdAndEquipmentTypeIdAndAcquiredDateBefore(baseId, equipmentTypeId, startDate)
                : assetRepository.countByEquipmentTypeIdAndAcquiredDateBefore(equipmentTypeId, startDate);

        List<PurchaseSummary> purchases = (baseId != null)
                ? purchaseRepository.findSummaryByBaseIdAndEquipmentTypeIdAndDateRange(baseId, equipmentTypeId, startDate, endDate)
                : purchaseRepository.findSummaryByEquipmentTypeIdAndDateRange(equipmentTypeId, startDate, endDate);

        Long purchasesQty = purchases.stream().mapToLong(PurchaseSummary::getQuantity).sum();
        BigDecimal purchasesValue = purchases.stream()
                .map(PurchaseSummary::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<TransferSummary> transfersIn = (baseId != null)
                ? transferRepository.findReceivedSummaryByBaseIdAndEquipmentTypeIdAndDateRange(baseId, equipmentTypeId, startDate, endDate)
                : transferRepository.findReceivedSummaryByEquipmentTypeIdAndDateRange(equipmentTypeId, startDate, endDate);

        Long transfersInQty = transfersIn.stream().mapToLong(TransferSummary::getQuantity).sum();

        List<TransferSummary> transfersOut = (baseId != null)
                ? transferRepository.findSentSummaryByBaseIdAndEquipmentTypeIdAndDateRange(baseId, equipmentTypeId, startDate, endDate)
                : transferRepository.findSentSummaryByEquipmentTypeIdAndDateRange(equipmentTypeId, startDate, endDate);

        Long transfersOutQty = transfersOut.stream().mapToLong(TransferSummary::getQuantity).sum();

        Long netMovement = purchasesQty + transfersInQty - transfersOutQty;

        Long closingBalance = (baseId != null)
                ? assetRepository.countByBaseIdAndEquipmentTypeIdAndAcquiredDateBefore(baseId, equipmentTypeId, endDate.plusDays(1))
                : assetRepository.countByEquipmentTypeIdAndAcquiredDateBefore(equipmentTypeId, endDate.plusDays(1));

        return NetMovementDetail.builder()
                .baseId(baseId)
                .baseCode(baseId != null ? baseRepository.findById(baseId).map(Base::getCode).orElse(null) : null)
                .baseName(baseId != null ? baseRepository.findById(baseId).map(Base::getName).orElse(null) : "All Bases")
                .equipmentTypeId(equipmentTypeId)
                .equipmentTypeCode(equipmentType.getCode())
                .equipmentTypeName(equipmentType.getName())
                .equipmentCategory(equipmentType.getCategory().name())
                .startDate(startDate)
                .endDate(endDate)
                .openingBalance(openingBalance)
                .purchasesQty(purchasesQty)
                .purchasesValue(purchasesValue)
                .purchases(purchases.stream()
                        .map(p -> NetMovementDetail.PurchaseSummary.builder()
                                .id(p.getId())
                                .quantity(p.getQuantity())
                                .unitCost(p.getUnitCost())
                                .totalCost(p.getTotalCost())
                                .purchaseDate(p.getPurchaseDate())
                                .supplier(p.getSupplier())
                                .invoiceReference(p.getInvoiceReference())
                                .build())
                        .collect(Collectors.toList()))
                .transfersInQty(transfersInQty)
                .transfersIn(transfersIn.stream()
                        .map(t -> NetMovementDetail.TransferSummary.builder()
                                .id(t.getId())
                                .quantity(t.getQuantity())
                                .transferDate(t.getTransferDate())
                                .status(t.getStatus().name())
                                .fromBaseCode(t.getFromBaseCode())
                                .toBaseCode(t.getToBaseCode())
                                .fromBaseName(t.getFromBaseName())
                                .toBaseName(t.getToBaseName())
                                .build())
                        .collect(Collectors.toList()))
                .transfersOutQty(transfersOutQty)
                .transfersOut(transfersOut.stream()
                        .map(t -> NetMovementDetail.TransferSummary.builder()
                                .id(t.getId())
                                .quantity(t.getQuantity())
                                .transferDate(t.getTransferDate())
                                .status(t.getStatus().name())
                                .fromBaseCode(t.getFromBaseCode())
                                .toBaseCode(t.getToBaseCode())
                                .fromBaseName(t.getFromBaseName())
                                .toBaseName(t.getToBaseName())
                                .build())
                        .collect(Collectors.toList()))
                .netMovement(netMovement)
                .closingBalance(closingBalance)
                .build();
    }
}