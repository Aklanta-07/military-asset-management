package com.militaryassetmgmt.controller;

import com.militaryassetmgmt.util.ApiResponse;
import com.militaryassetmgmt.dto.response.BaseResponse;
import com.militaryassetmgmt.dto.response.EquipmentTypeResponse;
import com.militaryassetmgmt.dto.response.PersonnelResponse;
import com.militaryassetmgmt.service.IBaseService;
import com.militaryassetmgmt.service.IEquipmentTypeService;
import com.militaryassetmgmt.service.IPersonnelService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@RestController
@RequestMapping("/api/reference")
@RequiredArgsConstructor
public class ReferenceDataController {

    private final IBaseService baseService;
    private final IEquipmentTypeService equipmentTypeService;
    private final IPersonnelService personnelService;

    @GetMapping("/bases")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
    public ApiResponse<List<BaseResponse>> getAllBases() {
        List<BaseResponse> bases = baseService.getAllBases();
        return ApiResponse.success(bases);
    }

    @GetMapping("/equipment-types")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
    public ApiResponse<List<EquipmentTypeResponse>> getAllEquipmentTypes() {
        List<EquipmentTypeResponse> equipmentTypes = equipmentTypeService.getAllActive();
        return ApiResponse.success(equipmentTypes);
    }

    @GetMapping("/personnel")
    @PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER')")
    public ApiResponse<List<PersonnelResponse>> getAllPersonnel(
            @RequestParam(required = false) Long baseId, Authentication authentication) {
        List<PersonnelResponse> personnel = personnelService.getPersonnel(baseId, true, authentication.getName());
        return ApiResponse.success(personnel);
    }
}