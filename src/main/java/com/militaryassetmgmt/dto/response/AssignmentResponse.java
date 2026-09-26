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
public class AssignmentResponse {

    private Long id;
    private Long assetId;
    private String assetSerialNumber;
    private Long equipmentTypeId;
    private String equipmentTypeCode;
    private String equipmentTypeName;
    private Long personnelId;
    private String personnelServiceNumber;
    private String personnelRank;
    private String personnelFullName;
    private String personnelUnit;
    private Long baseId;
    private String baseCode;
    private String baseName;
    private LocalDate assignedDate;
    private LocalDate returnedDate;
    private LocalDate expectedReturnDate;
    private String status;
    private Long assignedBy;
    private String assignedByName;
    private Long returnedBy;
    private String returnedByName;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}