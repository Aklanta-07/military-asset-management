package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.request.TransferRequest;
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

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransferService implements ITransferService {

    private final TransferRepository transferRepository;
    private final BaseRepository baseRepository;
    private final EquipmentTypeRepository equipmentTypeRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public TransferResponse createTransfer(TransferRequest request, String username) {
        if (request.getFromBaseId().equals(request.getToBaseId())) {
            throw new BusinessRuleViolationException("Source base and destination base cannot be the same");
        }

        Base fromBase = baseRepository.findById(request.getFromBaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Source base not found: " + request.getFromBaseId()));
        Base toBase = baseRepository.findById(request.getToBaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination base not found: " + request.getToBaseId()));
        EquipmentType equipmentType = equipmentTypeRepository.findById(request.getEquipmentTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment type not found: " + request.getEquipmentTypeId()));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (!user.isAdmin() && (user.getBaseId() == null || !user.getBaseId().equals(fromBase.getId()))) {
            throw new AccessDeniedException("You can only request transfers from your assigned base");
        }

        Transfer transfer = Transfer.builder()
                .equipmentType(equipmentType)
                .fromBase(fromBase)
                .toBase(toBase)
                .quantity(request.getQuantity())
                .transferDate(request.getTransferDate() != null ? request.getTransferDate() : LocalDate.now())
                .status("REQUESTED")
                .requestedBy(user)
                .notes(request.getNotes())
                .build();

        Transfer saved = transferRepository.save(transfer);
        auditLogService.logAction("Transfer", saved.getId(), "CREATE", null, saved.getStatus(),
                "status,quantity,fromBase,toBase", username, null, null, null, null);

        log.info("Transfer requested id={} by={} from={} to={} qty={}", saved.getId(), username, fromBase.getCode(), toBase.getCode(), saved.getQuantity());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TransferResponse> getTransfers(Long fromBaseId, Long toBaseId, Long equipmentTypeId,
                                                        String status, LocalDate startDate, LocalDate endDate,
                                                        int page, int size, String sortBy, String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Transfer> transferPage = transferRepository.findWithFilters(fromBaseId, toBaseId, equipmentTypeId, status, startDate, endDate, pageable);
        return PageResponse.of(transferPage.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
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

        if (!transfer.canApprove()) {
            throw new BusinessRuleViolationException("Transfer cannot be approved in its current status: " + transfer.getStatus());
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (!user.isAdmin() && !user.isBaseCommander()) {
            throw new AccessDeniedException("Only Admins and Base Commanders can approve transfers");
        }
        if (user.isBaseCommander() && !user.getBaseId().equals(transfer.getFromBase().getId())) {
            throw new AccessDeniedException("Base commanders can only approve transfers from their assigned base");
        }

        String oldStatus = transfer.getStatus();
        transfer.setStatus("APPROVED");
        transfer.setApprovedBy(user);
        transfer.setApprovedAt(Instant.now());

        Transfer saved = transferRepository.save(transfer);
        auditLogService.logAction("Transfer", saved.getId(), "APPROVE", oldStatus, saved.getStatus(),
                "status,approvedBy,approvedAt", username, null, null, null, null);

        log.info("Transfer approved id={} by={}", saved.getId(), username);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TransferResponse receiveTransfer(Long id, String username) {
        Transfer transfer = transferRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found with id: " + id));

        if (!transfer.canReceive()) {
            throw new BusinessRuleViolationException("Transfer cannot be received in status: " + transfer.getStatus());
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (!user.isAdmin() && (user.getBaseId() == null || !user.getBaseId().equals(transfer.getToBase().getId()))) {
            throw new AccessDeniedException("Only the destination base personnel or an admin can confirm receipt");
        }

        String oldStatus = transfer.getStatus();
        transfer.setStatus("RECEIVED");
        transfer.setReceivedBy(user);
        transfer.setReceivedAt(Instant.now());

        // Update individual serialized assets from fromBase to toBase if available
        List<Asset> availableAssets = assetRepository.findAvailableByBaseAndEquipmentType(
                transfer.getFromBase().getId(), transfer.getEquipmentType().getId()
        );
        int toTransfer = Math.min(availableAssets.size(), transfer.getQuantity());
        for (int i = 0; i < toTransfer; i++) {
            Asset asset = availableAssets.get(i);
            asset.setBase(transfer.getToBase());
            assetRepository.save(asset);
        }

        Transfer saved = transferRepository.save(transfer);
        auditLogService.logAction("Transfer", saved.getId(), "RECEIVE", oldStatus, saved.getStatus(),
                "status,receivedBy,receivedAt", username, null, null, null, null);

        log.info("Transfer received id={} by={}", saved.getId(), username);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TransferResponse cancelTransfer(Long id, String cancellationReason, String username) {
        Transfer transfer = transferRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found with id: " + id));

        if (!transfer.canCancel()) {
            throw new BusinessRuleViolationException("Transfer cannot be cancelled in status: " + transfer.getStatus());
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (!user.isAdmin() && !user.getBaseId().equals(transfer.getFromBase().getId())) {
            throw new AccessDeniedException("Only administrators or the source base personnel can cancel this transfer");
        }

        String oldStatus = transfer.getStatus();
        transfer.setStatus("CANCELLED");
        transfer.setCancelledBy(user);
        transfer.setCancelledAt(Instant.now());
        transfer.setCancellationReason(cancellationReason != null ? cancellationReason : "Cancelled by user");

        Transfer saved = transferRepository.save(transfer);
        auditLogService.logAction("Transfer", saved.getId(), "CANCEL", oldStatus, saved.getStatus(),
                "status,cancelledBy,cancelledAt,cancellationReason", username, null, null, null, null);

        log.info("Transfer cancelled id={} by={}", saved.getId(), username);
        return mapToResponse(saved);
    }

    private TransferResponse mapToResponse(Transfer t) {
        return TransferResponse.builder()
                .id(t.getId())
                .equipmentTypeId(t.getEquipmentType().getId())
                .equipmentTypeCode(t.getEquipmentType().getCode())
                .equipmentTypeName(t.getEquipmentType().getName())
                .equipmentCategory(t.getEquipmentType().getCategory())
                .fromBaseId(t.getFromBase().getId())
                .fromBaseCode(t.getFromBase().getCode())
                .fromBaseName(t.getFromBase().getName())
                .toBaseId(t.getToBase().getId())
                .toBaseCode(t.getToBase().getCode())
                .toBaseName(t.getToBase().getName())
                .quantity(t.getQuantity())
                .transferDate(t.getTransferDate())
                .status(t.getStatus())
                .requestedBy(t.getRequestedBy() != null ? t.getRequestedBy().getId() : null)
                .requestedByName(t.getRequestedBy() != null ? t.getRequestedBy().getFullName() : null)
                .approvedBy(t.getApprovedBy() != null ? t.getApprovedBy().getId() : null)
                .approvedByName(t.getApprovedBy() != null ? t.getApprovedBy().getFullName() : null)
                .approvedAt(t.getApprovedAt())
                .receivedBy(t.getReceivedBy() != null ? t.getReceivedBy().getId() : null)
                .receivedByName(t.getReceivedBy() != null ? t.getReceivedBy().getFullName() : null)
                .receivedAt(t.getReceivedAt())
                .cancelledBy(t.getCancelledBy() != null ? t.getCancelledBy().getId() : null)
                .cancelledByName(t.getCancelledBy() != null ? t.getCancelledBy().getFullName() : null)
                .cancelledAt(t.getCancelledAt())
                .cancellationReason(t.getCancellationReason())
                .notes(t.getNotes())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
