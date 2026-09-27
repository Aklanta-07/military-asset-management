package com.militaryassetmgmt.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenditureResponse {

    private Long id;
    private Long equipmentTypeId;
    private String equipmentTypeCode;
    private String equipmentTypeName;
    private String equipmentCategory;
    private Long baseId;
    private String baseCode;
    private String baseName;
    private Integer quantity;
    private LocalDate expenditureDate;
    private String reason;
    private String description;
    private String authorizedBy;
    private String authorizedByName;
    private Instant createdAt;
    private Instant updatedAt;
}