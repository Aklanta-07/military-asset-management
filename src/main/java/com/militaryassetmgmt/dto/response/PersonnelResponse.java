package com.militaryassetmgmt.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonnelResponse {

    private Long id;
    private String serviceNumber;
    private String rank;
    private String fullName;
    private String unit;
    private Long baseId;
    private String baseCode;
    private String baseName;
    private boolean active;
}