package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.response.EquipmentTypeResponse;

import java.util.List;

public interface IEquipmentTypeService {

    List<EquipmentTypeResponse> getAllActive();

    List<EquipmentTypeResponse> getByCategory(String category);

    EquipmentTypeResponse getById(Long id);

    EquipmentTypeResponse getByCode(String code);
}
