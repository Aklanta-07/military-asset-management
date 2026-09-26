package com.militaryassetmgmt.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ExpenditureRequest {

    @NotNull(message = "Equipment type ID is required")
    private Long equipmentTypeId;

    @NotNull(message = "Base ID is required")
    private Long baseId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;

    @NotNull(message = "Expenditure date is required")
    private LocalDate expenditureDate;

    @NotBlank(message = "Reason is required")
    @Size(max = 100, message = "Reason must not exceed 100 characters")
    private String reason;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}