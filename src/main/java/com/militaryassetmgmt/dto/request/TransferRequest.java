package com.militaryassetmgmt.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class TransferRequest {

    @NotNull(message = "Equipment type ID is required")
    private Long equipmentTypeId;

    @NotNull(message = "From base ID is required")
    private Long fromBaseId;

    @NotNull(message = "To base ID is required")
    private Long toBaseId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;

    @NotNull(message = "Transfer date is required")
    private LocalDate transferDate;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;
}