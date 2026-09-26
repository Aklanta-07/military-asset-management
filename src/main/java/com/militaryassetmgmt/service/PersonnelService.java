package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.response.PersonnelResponse;
import com.militaryassetmgmt.entity.Personnel;
import com.militaryassetmgmt.exception.ResourceNotFoundException;
import com.militaryassetmgmt.repository.PersonnelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PersonnelService implements IPersonnelService {

    private final PersonnelRepository personnelRepository;

    @Override
    public List<PersonnelResponse> getPersonnel(Long baseId, Boolean activeOnly) {
        List<Personnel> list;
        if (baseId != null) {
            list = Boolean.FALSE.equals(activeOnly)
                    ? personnelRepository.findByBaseId(baseId)
                    : personnelRepository.findActiveByBaseIdOrderByRank(baseId);
        } else {
            list = Boolean.FALSE.equals(activeOnly)
                    ? personnelRepository.findAll()
                    : personnelRepository.findByActiveTrue();
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public PersonnelResponse getById(Long id) {
        Personnel p = personnelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Personnel not found with id: " + id));
        return mapToResponse(p);
    }

    @Override
    public PersonnelResponse getByServiceNumber(String serviceNumber) {
        Personnel p = personnelRepository.findByServiceNumber(serviceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Personnel not found with service number: " + serviceNumber));
        return mapToResponse(p);
    }

    private PersonnelResponse mapToResponse(Personnel p) {
        return PersonnelResponse.builder()
                .id(p.getId())
                .serviceNumber(p.getServiceNumber())
                .rank(p.getRank())
                .fullName(p.getFullName())
                .unit(p.getUnit())
                .baseId(p.getBase().getId())
                .baseCode(p.getBase().getCode())
                .baseName(p.getBase().getName())
                .active(p.isActive())
                .build();
    }
}
