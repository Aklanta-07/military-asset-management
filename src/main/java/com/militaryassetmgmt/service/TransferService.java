package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.request.TransferRequest;
import com.militaryassetmgmt.util.PageResponse;
import com.militaryassetmgmt.dto.response.TransferResponse;
import com.militaryassetmgmt.entity.Asset;
import com.militaryassetmgmt.entity.Base;
import com.militaryassetmgmt.entity.EquipmentType;
import com.militaryassetmgmt.entity.Transfer;
import com.militaryassetmgmt.entity.User;
import com.militaryassetmgmt.exception.BusinessRuleViolationException;
import com.militaryassetmgmt.exception.ResourceNotFoundException;
import com.militaryassetmgmt.repository.AssetRepository;
import com.militaryassetmgmt.repository.BaseRepository;
import com.militaryassetmgmt.repository.EquipmentTypeRepository;
import com.militaryassetmgmt.repository.TransferRepository;
import com.militaryassetmgmt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class TransferService implements ITransferService {

    private final TransferRepository transferRepository;
    private final BaseRepository baseRepository;
    private final EquipmentTypeRepository equipmentTypeRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public TransferResponse createTransfer(TransferRequest request, String username) {
        Base fromBase = baseRepository.findById(request.getFromBaseId())
                .orElseThrow(() -> new ResourceNotFoundException("From base not found with id: " + request.getFromBaseId()));

        Base toBase = baseRepository.findById(request.getToBaseId())
                .orElseThrow(() -> new ResourceNotFoundException("To base not found with id: " + request.getToBaseId()));

        if (fromBase.getId().equals(toBase.getId())) {
            throw new BusinessRuleViolationException("From base and To base cannot be the same");
        }

        EquipmentType equipmentType = equipmentTypeRepository.findById(request.getEquipmentTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment type not found with id: " + request.getEquipmentTypeId()));

        User requestedBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        // Check available quantity at from base
        Long availableQty = assetRepository.countAvailableByBaseAndEquipmentType(fromBase.getId(), equipmentType.getId());
        if (availableQty < request.getQuantity()) {
            throw new BusinessRuleViolationException(
                    String.format("Insufficient available quantity. Available: %d, Requested: %d", availableQty, request.getQuantity()));
        }

        Transfer transfer = Transfer.builder()
                .fromBase(fromBase)
                .toBase(toBase)
                .equipmentType(equipmentType)
                .quantity(request.getQuantity())
                .transferDate(request.getTransferDate())
                .status(Transfer.Status.REQUESTED)
                .requestedBy(requestedBy)
                .notes(request.getNotes())
                .build();

        Transfer savedTransfer = transferRepository.save(transfer);
        return mapToResponse(savedTransfer);
    }

    @Override
    public PageResponse<TransferResponse> getTransfers(Long fromBaseId, Long toBaseId, Long equipmentTypeId,
                                                        String status, LocalDate startDate, LocalDate endDate,
                                                        int page, int size, String sortBy, String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Transfer> transferPage = transferRepository.findWithFilters(fromBaseId, toBaseId, equipmentTypeId, status, startDate, endDate, pageable);

        return PageResponse.of(transferPage.map(this::mapToResponse));
    }

    @Override
    public TransferResponse getTransferById(Long id) {
        Transfer transfer = transferRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found with id: " + id));
        return mapToResponse(transfer);
    }

    @Override
    @Transactional
    public TransferResponse approveTransfer(Long id, String username) {
        Transfer transfer = transferRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found with id: " + id));

        if (!Transfer.Status.REQUESTED.equals(transfer.getStatus())) {
            throw new BusinessRuleViolationException("Can only approve transfers with REQUESTED status");
        }

        User approvedBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        // Check if user is authorized to approve (Admin or Base Commander of fromBase)
        if (!approvedBy.isAdmin() && !approvedBy.getBaseId().equals(transfer.getFromBase().getId())) {
            throw new BusinessRuleViolationException("Not authorized to approve this transfer");
        }

        transfer.setStatus(Transfer.Status.APPROVED);
        transfer.setApprovedBy(approvedBy);
        transfer.setApprovedAt(Instant.now());

        Transfer savedTransfer = transferRepository.save(transfer);
        return mapToResponse(savedTransfer);
    }

    @Override
    @Transactional
    public TransferResponse receiveTransfer(Long id, String username) {
        Transfer transfer = transferRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found with id: " + id));

        if (!Transfer.Status.APPROVED.equals(transfer.getStatus()) && !Transfer.Status.IN_TRANSIT.equals(transfer.getStatus())) {
            throw new BusinessRuleViolationException("Can only receive transfers with APPROVED or IN_TRANSIT status");
        }

        User receivedBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        // Check if user is authorized to receive (Admin or Base Commander of toBase)
        if (!receivedBy.isAdmin() && !receivedBy.getBaseId().equals(transfer.getToBase().getId())) {
            throw new BusinessRuleViolationException("Not authorized to receive this transfer");
        }

        transfer.setStatus(Transfer.Status.RECEIVED);
        transfer.setReceivedBy(receivedBy);
        transfer.setReceivedAt(Instant.now());

        BigDecimal assetValue =
        EquipmentType.Category.AMMUNITION.equals(transfer.getEquipmentType().getCategory())
                ? BigDecimal.valueOf(0.5)
                : BigDecimal.valueOf(1000);
        // Create assets at destination base
        for (int i = 0; i < transfer.getQuantity(); i++) {
            Asset asset = Asset.builder()
                    .base(transfer.getToBase())
                    .equipmentType(transfer.getEquipmentType())
                    .serialNumber(generateSerialNumber(transfer.getEquipmentType().getCode(), transfer.getToBase().getCode()))
                    .status(Asset.Status.AVAILABLE)
                    .condition(Asset.Condition.SERVICEABLE)
                    .acquiredDate(transfer.getTransferDate())
                    .acquisitionValue(assetValue)
                    .currentValue(assetValue)
                    .active(1)
                    .build();
            assetRepository.save(asset);
        }

        Transfer savedTransfer = transferRepository.save(transfer);
        return mapToResponse(savedTransfer);
    }

    @Override
    @Transactional
    public TransferResponse cancelTransfer(Long id, String cancellationReason, String username) {
        Transfer transfer = transferRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found with id: " + id));

        if (Transfer.Status.RECEIVED.equals(transfer.getStatus())) {
            throw new BusinessRuleViolationException("Cannot cancel a transfer that has been received");
        }

        if (Transfer.Status.CANCELLED.equals(transfer.getStatus())) {
            throw new BusinessRuleViolationException("Transfer is already cancelled");
        }

        User cancelledBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        // Check if user is authorized to cancel (Admin or Requester or Base Commander of fromBase)
        if (!cancelledBy.isAdmin() &&
            !cancelledBy.getId().equals(transfer.getRequestedBy().getId()) &&
            !cancelledBy.getBaseId().equals(transfer.getFromBase().getId())) {
            throw new BusinessRuleViolationException("Not authorized to cancel this transfer");
        }

        transfer.setStatus(Transfer.Status.CANCELLED);
        transfer.setCancelledBy(cancelledBy);
        transfer.setCancelledAt(Instant.now());
        transfer.setNotes((transfer.getNotes() != null ? transfer.getNotes() + "; " : "") + "Cancelled: " + cancellationReason);

        Transfer savedTransfer = transferRepository.save(transfer);
        return mapToResponse(savedTransfer);
    }

    private String generateSerialNumber(String equipmentCode, String baseCode) {
        long count = assetRepository.count() + 1;
        return String.format("%s-%s-%06d", equipmentCode, baseCode, count);
    }

    private TransferResponse mapToResponse(Transfer transfer) {
        return TransferResponse.builder()
                .id(transfer.getId())
                .fromBaseId(transfer.getFromBase().getId())
                .fromBaseCode(transfer.getFromBase().getCode())
                .fromBaseName(transfer.getFromBase().getName())
                .toBaseId(transfer.getToBase().getId())
                .toBaseCode(transfer.getToBase().getCode())
                .toBaseName(transfer.getToBase().getName())
                .equipmentTypeId(transfer.getEquipmentType().getId())
                .equipmentTypeCode(transfer.getEquipmentType().getCode())
                .equipmentTypeName(transfer.getEquipmentType().getName())
                .quantity(transfer.getQuantity())
                .transferDate(transfer.getTransferDate())
                .status(transfer.getStatus().name())
                .requestedBy(transfer.getRequestedBy().getUsername())
                .approvedBy(transfer.getApprovedBy() != null ? transfer.getApprovedBy().getUsername() : null)
                .approvedAt(transfer.getApprovedAt())
                .receivedBy(transfer.getReceivedBy() != null ? transfer.getReceivedBy().getUsername() : null)
                .receivedAt(transfer.getReceivedAt())
                .cancelledBy(transfer.getCancelledBy() != null ? transfer.getCancelledBy().getUsername() : null)
                .cancelledAt(transfer.getCancelledAt())
                .notes(transfer.getNotes())
                .createdAt(transfer.getCreatedAt())
                .updatedAt(transfer.getUpdatedAt())
                .build();
    }
}