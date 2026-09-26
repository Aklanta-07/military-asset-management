package com.militaryassetmgmt.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BaseResponse {

    private Long id;
    private String code;
    private String name;
    private String location;
    private Long commanderId;
    private String commanderName;
    private boolean active;
}