package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.response.BaseResponse;

import java.util.List;

public interface IBaseService {

    List<BaseResponse> getAllActiveBases();

    List<BaseResponse> getAllBases();

    BaseResponse getBaseById(Long id);

    BaseResponse getBaseByCode(String code);
}
