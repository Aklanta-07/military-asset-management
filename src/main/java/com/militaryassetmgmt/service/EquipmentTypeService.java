package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.response.EquipmentTypeResponse;
import com.militaryassetmgmt.entity.EquipmentType;
import com.militaryassetmgmt.exception.ResourceNotFoundException;
import com.militaryassetmgmt.repository.EquipmentTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EquipmentTypeService implements IEquipmentTypeService {

    private final EquipmentTypeRepository equipmentTypeRepository;

    @Override
    public List<EquipmentTypeResponse> getAllActive() {
        return equipmentTypeRepository.findByActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<EquipmentTypeResponse> getByCategory(String category) {
        return equipmentTypeRepository.findActiveByCategory(category).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public EquipmentTypeResponse getById(Long id) {
        EquipmentType eq = equipmentTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment type not found with id: " + id));
        return mapToResponse(eq);
    }

    @Override
    public EquipmentTypeResponse getByCode(String code) {
        EquipmentType eq = equipmentTypeRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment type not found with code: " + code));
        return mapToResponse(eq);
    }

    private EquipmentTypeResponse mapToResponse(EquipmentType et) {
        return EquipmentTypeResponse.builder()
                .id(et.getId())
                .code(et.getCode())
                .name(et.getName())
                .category(et.getCategory())
                .unitOfMeasure(et.getUnitOfMeasure())
                .description(et.getDescription())
                .active(et.isActive())
                .build();
    }
}
