package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.request.ExpenditureRequest;
import com.militaryassetmgmt.dto.response.ExpenditureResponse;
import com.militaryassetmgmt.util.PageResponse;
import com.militaryassetmgmt.entity.Asset;
import com.militaryassetmgmt.entity.Base;
import com.militaryassetmgmt.entity.EquipmentType;
import com.militaryassetmgmt.entity.Expenditure;
import com.militaryassetmgmt.entity.User;
import com.militaryassetmgmt.exception.BusinessRuleViolationException;
import com.militaryassetmgmt.exception.ResourceNotFoundException;
import com.militaryassetmgmt.repository.AssetRepository;
import com.militaryassetmgmt.repository.BaseRepository;
import com.militaryassetmgmt.repository.EquipmentTypeRepository;
import com.militaryassetmgmt.repository.ExpenditureRepository;
import com.militaryassetmgmt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class ExpenditureService implements IExpenditureService {

    private final ExpenditureRepository expenditureRepository;
    private final BaseRepository baseRepository;
    private final EquipmentTypeRepository equipmentTypeRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ExpenditureResponse createExpenditure(ExpenditureRequest request, String username) {
        Base base = baseRepository.findById(request.getBaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Base not found with id: " + request.getBaseId()));

        EquipmentType equipmentType = equipmentTypeRepository.findById(request.getEquipmentTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment type not found with id: " + request.getEquipmentTypeId()));

        User authorizedBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        // Check if user is authorized (Admin or Base Commander of the base)
        if (!authorizedBy.isAdmin() && !authorizedBy.getBaseId().equals(base.getId())) {
            throw new BusinessRuleViolationException("Not authorized to record expenditures for this base");
        }

        // Check available quantity
        Long availableQty = assetRepository.countAvailableByBaseAndEquipmentType(base.getId(), equipmentType.getId());
        if (availableQty < request.getQuantity()) {
            throw new BusinessRuleViolationException(
                    String.format("Insufficient available quantity for expenditure. Available: %d, Requested: %d", availableQty, request.getQuantity()));
        }

        Expenditure expenditure = Expenditure.builder()
                .base(base)
                .equipmentType(equipmentType)
                .quantity(request.getQuantity())
                .expenditureDate(request.getExpenditureDate())
                .reason(Expenditure.Reason.valueOf(request.getReason().trim().toUpperCase()))
                .description(request.getDescription())
                .authorizedBy(authorizedBy)
                .build();

        // Update asset statuses to EXPENDED (mark that many available assets as expended)
        List<Asset> availableAssets = assetRepository.findAvailableByBaseAndEquipmentType(base.getId(), equipmentType.getId());
        int toExpend = request.getQuantity();
        for (Asset asset : availableAssets) {
            if (toExpend <= 0) break;
            asset.setStatus(Asset.Status.EXPENDED);
            asset.setActive(0);
            assetRepository.save(asset);
            toExpend--;
        }

        Expenditure savedExpenditure = expenditureRepository.save(expenditure);
        return mapToResponse(savedExpenditure);
    }

    @Override
    public PageResponse<ExpenditureResponse> getExpenditures(Long baseId, Long equipmentTypeId, String reason,
                                                              LocalDate startDate, LocalDate endDate,
                                                              int page, int size, String sortBy, String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Expenditure> expenditurePage = expenditureRepository.findWithFilters(baseId, equipmentTypeId, reason, startDate, endDate, pageable);

        return PageResponse.of(expenditurePage.map(this::mapToResponse));
    }

    @Override
    public ExpenditureResponse getExpenditureById(Long id) {
        Expenditure expenditure = expenditureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expenditure not found with id: " + id));
        return mapToResponse(expenditure);
    }

    private ExpenditureResponse mapToResponse(Expenditure expenditure) {
        return ExpenditureResponse.builder()
                .id(expenditure.getId())
                .baseId(expenditure.getBase().getId())
                .baseCode(expenditure.getBase().getCode())
                .baseName(expenditure.getBase().getName())
                .equipmentTypeId(expenditure.getEquipmentType().getId())
                .equipmentTypeCode(expenditure.getEquipmentType().getCode())
                .equipmentTypeName(expenditure.getEquipmentType().getName())
                .quantity(expenditure.getQuantity())
                .expenditureDate(expenditure.getExpenditureDate())
                .reason(expenditure.getReason().name())
                .description(expenditure.getDescription())
                .authorizedBy(expenditure.getAuthorizedBy().getUsername())
                .createdAt(expenditure.getCreatedAt())
                .updatedAt(expenditure.getUpdatedAt())
                .build();
    }
}