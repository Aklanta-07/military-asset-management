package com.militaryassetmgmt.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseResponse {

    private Long id;
    private Long equipmentTypeId;
    private String equipmentTypeCode;
    private String equipmentTypeName;
    private String equipmentCategory;
    private Long baseId;
    private String baseCode;
    private String baseName;
    private Integer quantity;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private LocalDate purchaseDate;
    private String supplier;
    private String invoiceReference;
    private String description;
    private String status;
    private Long createdBy;
    private String createdByName;
    private Instant createdAt;
    private Instant updatedAt;
}