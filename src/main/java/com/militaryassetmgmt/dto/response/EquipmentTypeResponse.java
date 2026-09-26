package com.militaryassetmgmt.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentTypeResponse {

    private Long id;
    private String code;
    private String name;
    private String category;
    private String unitOfMeasure;
    private String description;
    private boolean active;
}