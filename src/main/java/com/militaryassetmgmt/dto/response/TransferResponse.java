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
public class TransferResponse {

    private Long id;
    private Long equipmentTypeId;
    private String equipmentTypeCode;
    private String equipmentTypeName;
    private String equipmentCategory;
    private Long fromBaseId;
    private String fromBaseCode;
    private String fromBaseName;
    private Long toBaseId;
    private String toBaseCode;
    private String toBaseName;
    private Integer quantity;
    private LocalDate transferDate;
    private String status;
    private String requestedBy;
    private String requestedByName;
    private String approvedBy;
    private String approvedByName;
    private Instant approvedAt;
    private String receivedBy;
    private String receivedByName;
    private Instant receivedAt;
    private String cancelledBy;
    private String cancelledByName;
    private Instant cancelledAt;
    private String cancellationReason;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}