package com.militaryassetmgmt.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class PurchaseSummary {

    private final Long id;
    private final Integer quantity;
    private final BigDecimal unitCost;
    private final BigDecimal totalCost;
    private final LocalDate purchaseDate;
    private final String supplier;
    private final String invoiceReference;
}
