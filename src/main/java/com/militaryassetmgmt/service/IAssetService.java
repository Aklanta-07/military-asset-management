package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.response.AssetResponse;
import com.militaryassetmgmt.util.PageResponse;

import java.util.List;

public interface IAssetService {

    PageResponse<AssetResponse> getAssets(Long baseId, Long equipmentTypeId, String status, int page, int size);

    AssetResponse getAssetById(Long id);

    AssetResponse getAssetBySerialNumber(String serialNumber);

    List<AssetResponse> getAvailableAssets(Long baseId, Long equipmentTypeId);
}
