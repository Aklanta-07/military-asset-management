package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.response.AssetResponse;
import com.militaryassetmgmt.entity.Asset;
import com.militaryassetmgmt.util.PageResponse;

import java.util.List;

public interface IAssetService {

    PageResponse<AssetResponse> getAssets(Long baseId, Long equipmentTypeId, Asset.Status status, int page, int size, String username);

    AssetResponse getAssetById(Long id, String username);

    AssetResponse getAssetBySerialNumber(String serialNumber);

    List<AssetResponse> getAvailableAssets(Long baseId, Long equipmentTypeId);
}
