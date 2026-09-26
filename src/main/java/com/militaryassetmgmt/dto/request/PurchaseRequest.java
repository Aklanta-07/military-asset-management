package com.militaryassetmgmt.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PurchaseRequest {

    @NotNull(message = "Equipment type ID is required")
    private Long equipmentTypeId;

    @NotNull(message = "Base ID is required")
    private Long baseId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;

    @NotNull(message = "Unit cost is required")
    @Positive(message = "Unit cost must be positive")
    private BigDecimal unitCost;

    @NotNull(message = "Purchase date is required")
    private LocalDate purchaseDate;

    @Size(max = 200, message = "Supplier name must not exceed 200 characters")
    private String supplier;

    @Size(max = 100, message = "Invoice reference must not exceed 100 characters")
    private String invoiceReference;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}