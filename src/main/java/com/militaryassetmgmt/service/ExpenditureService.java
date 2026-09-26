package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.request.ExpenditureRequest;
import com.militaryassetmgmt.dto.response.ExpenditureResponse;
import com.militaryassetmgmt.entity.Asset;
import com.militaryassetmgmt.entity.Base;
import com.militaryassetmgmt.entity.EquipmentType;
import com.militaryassetmgmt.entity.Expenditure;
import com.militaryassetmgmt.entity.User;
import com.militaryassetmgmt.exception.ResourceNotFoundException;
import com.militaryassetmgmt.repository.AssetRepository;
import com.militaryassetmgmt.repository.BaseRepository;
import com.militaryassetmgmt.repository.EquipmentTypeRepository;
import com.militaryassetmgmt.repository.ExpenditureRepository;
import com.militaryassetmgmt.repository.UserRepository;
import com.militaryassetmgmt.util.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenditureService implements IExpenditureService {

    private final ExpenditureRepository expenditureRepository;
    private final BaseRepository baseRepository;
    private final EquipmentTypeRepository equipmentTypeRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public ExpenditureResponse createExpenditure(ExpenditureRequest request, String username) {
        Base base = baseRepository.findById(request.getBaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Base not found: " + request.getBaseId()));

        EquipmentType equipmentType = equipmentTypeRepository.findById(request.getEquipmentTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment type not found: " + request.getEquipmentTypeId()));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (!user.isAdmin() && !user.getBaseId().equals(base.getId())) {
            throw new AccessDeniedException("You can only record expenditures for your assigned base");
        }

        Expenditure expenditure = Expenditure.builder()
                .base(base)
                .equipmentType(equipmentType)
                .quantity(request.getQuantity())
                .expenditureDate(request.getExpenditureDate() != null ? request.getExpenditureDate() : LocalDate.now())
                .reason(request.getReason())
                .description(request.getDescription())
                .authorizedBy(user)
                .build();

        Expenditure saved = expenditureRepository.save(expenditure);

        // Mark individual serialized assets as EXPENDED if available
        List<Asset> availableAssets = assetRepository.findAvailableByBaseAndEquipmentType(base.getId(), equipmentType.getId());
        int toExpend = Math.min(availableAssets.size(), request.getQuantity());
        for (int i = 0; i < toExpend; i++) {
            Asset asset = availableAssets.get(i);
            asset.setStatus("EXPENDED");
            assetRepository.save(asset);
        }

        auditLogService.logAction("Expenditure", saved.getId(), "EXPEND", null, saved.getReason(),
                "quantity,reason,baseId,equipmentTypeId", username, null, null, null, null);

        log.info("Expenditure recorded id={} qty={} equipment={} base={} by={}",
                saved.getId(), saved.getQuantity(), equipmentType.getCode(), base.getCode(), username);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ExpenditureResponse> getExpenditures(Long baseId, Long equipmentTypeId, String reason,
                                                            LocalDate startDate, LocalDate endDate,
                                                            int page, int size, String sortBy, String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Expenditure> pageResult = expenditureRepository.findWithFilters(baseId, equipmentTypeId, reason, startDate, endDate, pageable);
        return PageResponse.of(pageResult.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenditureResponse getExpenditureById(Long id) {
        Expenditure expenditure = expenditureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expenditure not found with id: " + id));
        return mapToResponse(expenditure);
    }

    private ExpenditureResponse mapToResponse(Expenditure e) {
        return ExpenditureResponse.builder()
                .id(e.getId())
                .equipmentTypeId(e.getEquipmentType().getId())
                .equipmentTypeCode(e.getEquipmentType().getCode())
                .equipmentTypeName(e.getEquipmentType().getName())
                .equipmentCategory(e.getEquipmentType().getCategory())
                .baseId(e.getBase().getId())
                .baseCode(e.getBase().getCode())
                .baseName(e.getBase().getName())
                .quantity(e.getQuantity())
                .expenditureDate(e.getExpenditureDate())
                .reason(e.getReason())
                .description(e.getDescription())
                .authorizedBy(e.getAuthorizedBy() != null ? e.getAuthorizedBy().getId() : null)
                .authorizedByName(e.getAuthorizedBy() != null ? e.getAuthorizedBy().getFullName() : null)
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
