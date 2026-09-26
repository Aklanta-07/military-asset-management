package com.militaryassetmgmt.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class AssignmentRequest {

    @NotNull(message = "Asset ID is required")
    private Long assetId;

    @NotNull(message = "Personnel ID is required")
    private Long personnelId;

    @NotNull(message = "Assigned date is required")
    private LocalDate assignedDate;

    private LocalDate expectedReturnDate;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;
}