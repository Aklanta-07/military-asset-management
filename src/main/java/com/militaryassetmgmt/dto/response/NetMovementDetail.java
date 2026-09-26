package com.militaryassetmgmt.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NetMovementDetail {

    private Long baseId;
    private String baseCode;
    private String baseName;
    private Long equipmentTypeId;
    private String equipmentTypeCode;
    private String equipmentTypeName;
    private String equipmentCategory;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long openingBalance;
    private Long purchasesQty;
    private BigDecimal purchasesValue;
    private List<PurchaseSummary> purchases;
    private Long transfersInQty;
    private List<TransferSummary> transfersIn;
    private Long transfersOutQty;
    private List<TransferSummary> transfersOut;
    private Long netMovement;
    private Long closingBalance;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseSummary {
        private Long id;
        private Integer quantity;
        private BigDecimal unitCost;
        private BigDecimal totalCost;
        private LocalDate purchaseDate;
        private String supplier;
        private String invoiceReference;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransferSummary {
        private Long id;
        private Integer quantity;
        private LocalDate transferDate;
        private String status;
        private String fromBaseCode;
        private String toBaseCode;
        private String fromBaseName;
        private String toBaseName;
    }
}