package com.militaryassetmgmt.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummary {

    private Long baseId;
    private String baseCode;
    private String baseName;
    private Integer equipmentTypesCount;

    // Core Metrics
    private Long openingBalance;
    private Long closingBalance;
    private Long purchasesQty;
    private BigDecimal purchasesValue;
    private Long transfersInQty;
    private Long transfersOutQty;
    private Long netMovement;
    private Long assignedQty;
    private Long expendedQty;

    // Aliases / Compatibility fields
    private Long totalAssets;
    private Long totalPurchases;
    private Long totalTransfersIn;
    private Long totalTransfersOut;
    private Long totalAssigned;
    private Long totalExpended;

    private List<EquipmentTypeSummary> equipmentTypeSummaries;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquipmentTypeSummary {
        private Long equipmentTypeId;
        private String equipmentTypeCode;
        private String equipmentTypeName;
        private String equipmentCategory;
        private Long openingBalance;
        private Long currentBalance;
        private Long purchasesQty;
        private Long transfersInQty;
        private Long transfersOutQty;
        private Long netMovement;
        private Long assignedQty;
        private Long expendedQty;
    }
}