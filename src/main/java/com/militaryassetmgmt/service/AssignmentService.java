package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.request.AssignmentRequest;
import com.militaryassetmgmt.dto.response.AssignmentResponse;
import com.militaryassetmgmt.entity.Asset;
import com.militaryassetmgmt.entity.Assignment;
import com.militaryassetmgmt.entity.Personnel;
import com.militaryassetmgmt.entity.User;
import com.militaryassetmgmt.exception.BusinessRuleViolationException;
import com.militaryassetmgmt.exception.ResourceNotFoundException;
import com.militaryassetmgmt.repository.AssetRepository;
import com.militaryassetmgmt.repository.AssignmentRepository;
import com.militaryassetmgmt.repository.PersonnelRepository;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class AssignmentService implements IAssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssetRepository assetRepository;
    private final PersonnelRepository personnelRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public AssignmentResponse createAssignment(AssignmentRequest request, String username) {
        Asset asset = assetRepository.findById(request.getAssetId())
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + request.getAssetId()));

        if (!"AVAILABLE".equals(asset.getStatus())) {
            throw new BusinessRuleViolationException("Asset is not available for assignment. Current status: " + asset.getStatus());
        }

        Personnel personnel = personnelRepository.findById(request.getPersonnelId())
                .orElseThrow(() -> new ResourceNotFoundException("Personnel not found with id: " + request.getPersonnelId()));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (!user.isAdmin() && !user.getBaseId().equals(asset.getBase().getId())) {
            throw new AccessDeniedException("You can only assign assets belonging to your assigned base");
        }

        // Mark asset as ASSIGNED
        asset.setStatus("ASSIGNED");
        assetRepository.save(asset);

        Assignment assignment = Assignment.builder()
                .asset(asset)
                .personnel(personnel)
                .assignedDate(request.getAssignedDate() != null ? request.getAssignedDate() : LocalDate.now())
                .expectedReturnDate(request.getExpectedReturnDate())
                .status("ACTIVE")
                .assignedBy(user)
                .notes(request.getNotes())
                .build();

        Assignment saved = assignmentRepository.save(assignment);
        auditLogService.logAction("Assignment", saved.getId(), "ASSIGN", null, saved.getStatus(),
                "assetId,personnelId,status", username, null, null, null, null);

        log.info("Asset {} assigned to personnel {} by {}", asset.getSerialNumber(), personnel.getServiceNumber(), username);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AssignmentResponse> getAssignments(Long assetId, Long personnelId, String status,
                                                           LocalDate startDate, LocalDate endDate,
                                                           int page, int size, String sortBy, String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Assignment> pageResult = assignmentRepository.findWithFilters(assetId, personnelId, status, startDate, endDate, pageable);
        return PageResponse.of(pageResult.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public AssignmentResponse getAssignmentById(Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));
        return mapToResponse(assignment);
    }

    @Override
    @Transactional
    public AssignmentResponse returnAsset(Long id, LocalDate returnedDate, String username) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        if (!"ACTIVE".equals(assignment.getStatus())) {
            throw new BusinessRuleViolationException("Assignment is not active. Current status: " + assignment.getStatus());
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        assignment.setStatus("RETURNED");
        assignment.setReturnedDate(returnedDate != null ? returnedDate : LocalDate.now());
        assignment.setReturnedBy(user);

        // Asset becomes AVAILABLE again
        Asset asset = assignment.getAsset();
        asset.setStatus("AVAILABLE");
        assetRepository.save(asset);

        Assignment saved = assignmentRepository.save(assignment);
        auditLogService.logAction("Assignment", saved.getId(), "RETURN", "ACTIVE", "RETURNED",
                "status,returnedDate,returnedBy", username, null, null, null, null);

        log.info("Asset {} returned by {} on {}", asset.getSerialNumber(), username, assignment.getReturnedDate());
        return mapToResponse(saved);
    }

    private AssignmentResponse mapToResponse(Assignment a) {
        return AssignmentResponse.builder()
                .id(a.getId())
                .assetId(a.getAsset().getId())
                .assetSerialNumber(a.getAsset().getSerialNumber())
                .equipmentTypeId(a.getAsset().getEquipmentType().getId())
                .equipmentTypeCode(a.getAsset().getEquipmentType().getCode())
                .equipmentTypeName(a.getAsset().getEquipmentType().getName())
                .personnelId(a.getPersonnel().getId())
                .personnelServiceNumber(a.getPersonnel().getServiceNumber())
                .personnelRank(a.getPersonnel().getRank())
                .personnelFullName(a.getPersonnel().getFullName())
                .personnelUnit(a.getPersonnel().getUnit())
                .baseId(a.getAsset().getBase().getId())
                .baseCode(a.getAsset().getBase().getCode())
                .baseName(a.getAsset().getBase().getName())
                .assignedDate(a.getAssignedDate())
                .returnedDate(a.getReturnedDate())
                .expectedReturnDate(a.getExpectedReturnDate())
                .status(a.getStatus())
                .assignedBy(a.getAssignedBy() != null ? a.getAssignedBy().getId() : null)
                .assignedByName(a.getAssignedBy() != null ? a.getAssignedBy().getFullName() : null)
                .returnedBy(a.getReturnedBy() != null ? a.getReturnedBy().getId() : null)
                .returnedByName(a.getReturnedBy() != null ? a.getReturnedBy().getFullName() : null)
                .notes(a.getNotes())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
