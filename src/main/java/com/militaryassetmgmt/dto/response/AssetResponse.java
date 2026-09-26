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
public class AssetResponse {

    private Long id;
    private Long equipmentTypeId;
    private String equipmentTypeCode;
    private String equipmentTypeName;
    private String equipmentCategory;
    private Long baseId;
    private String baseCode;
    private String baseName;
    private String serialNumber;
    private String status;
    private String condition;
    private LocalDate acquiredDate;
    private BigDecimal acquisitionValue;
    private BigDecimal currentValue;
    private String notes;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;
}
