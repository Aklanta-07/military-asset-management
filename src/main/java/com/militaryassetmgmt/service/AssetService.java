package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.response.AssetResponse;
import com.militaryassetmgmt.entity.Asset;
import com.militaryassetmgmt.exception.ResourceNotFoundException;
import com.militaryassetmgmt.repository.AssetRepository;
import com.militaryassetmgmt.util.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssetService implements IAssetService {

    private final AssetRepository assetRepository;

    @Override
    public PageResponse<AssetResponse> getAssets(Long baseId, Long equipmentTypeId, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Asset> assetPage = assetRepository.findWithFilters(baseId, equipmentTypeId, status, pageable);
        return PageResponse.of(assetPage.map(this::mapToResponse));
    }

    @Override
    public AssetResponse getAssetById(Long id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + id));
        return mapToResponse(asset);
    }

    @Override
    public AssetResponse getAssetBySerialNumber(String serialNumber) {
        Asset asset = assetRepository.findBySerialNumber(serialNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with serial number: " + serialNumber));
        return mapToResponse(asset);
    }

    @Override
    public List<AssetResponse> getAvailableAssets(Long baseId, Long equipmentTypeId) {
        return assetRepository.findAvailableByBaseAndEquipmentType(baseId, equipmentTypeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AssetResponse mapToResponse(Asset a) {
        return AssetResponse.builder()
                .id(a.getId())
                .equipmentTypeId(a.getEquipmentType().getId())
                .equipmentTypeCode(a.getEquipmentType().getCode())
                .equipmentTypeName(a.getEquipmentType().getName())
                .equipmentCategory(a.getEquipmentType().getCategory().name())
                .baseId(a.getBase().getId())
                .baseCode(a.getBase().getCode())
                .baseName(a.getBase().getName())
                .serialNumber(a.getSerialNumber())
                .status(a.getStatus().name())
                .condition(a.getCondition().name())
                .acquiredDate(a.getAcquiredDate())
                .acquisitionValue(a.getAcquisitionValue())
                .currentValue(a.getCurrentValue())
                .notes(a.getNotes())
                .active(a.isActive())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
