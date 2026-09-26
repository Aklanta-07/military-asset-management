package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.response.BaseResponse;
import com.militaryassetmgmt.entity.Base;
import com.militaryassetmgmt.exception.ResourceNotFoundException;
import com.militaryassetmgmt.repository.BaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BaseService implements IBaseService {

    private final BaseRepository baseRepository;

    @Override
    public List<BaseResponse> getAllActiveBases() {
        return baseRepository.findByActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BaseResponse> getAllBases() {
        return baseRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BaseResponse getBaseById(Long id) {
        Base base = baseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Base not found with id: " + id));
        return mapToResponse(base);
    }

    @Override
    public BaseResponse getBaseByCode(String code) {
        Base base = baseRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Base not found with code: " + code));
        return mapToResponse(base);
    }

    private BaseResponse mapToResponse(Base b) {
        return BaseResponse.builder()
                .id(b.getId())
                .code(b.getCode())
                .name(b.getName())
                .location(b.getLocation())
                .commanderId(b.getCommander() != null ? b.getCommander().getId() : null)
                .commanderName(b.getCommander() != null ? b.getCommander().getFullName() : null)
                .active(b.isActive())
                .build();
    }
}
