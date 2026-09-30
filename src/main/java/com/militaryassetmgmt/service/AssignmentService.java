package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.request.AssignmentRequest;
import com.militaryassetmgmt.dto.response.AssignmentResponse;
import com.militaryassetmgmt.util.PageResponse;
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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AssignmentService implements IAssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssetRepository assetRepository;
    private final PersonnelRepository personnelRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public AssignmentResponse createAssignment(AssignmentRequest request, String username) {
        Asset asset = assetRepository.findById(request.getAssetId())
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + request.getAssetId()));

        if (Asset.Status.AVAILABLE != asset.getStatus()) {
            throw new BusinessRuleViolationException("Asset is not available for assignment. Current status: " + asset.getStatus());
        }

        Personnel personnel = personnelRepository.findById(request.getPersonnelId())
                .orElseThrow(() -> new ResourceNotFoundException("Personnel not found with id: " + request.getPersonnelId()));

        if (!personnel.isActive()) {
            throw new BusinessRuleViolationException("Personnel is not active");
        }

        User assignedBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        // Check if user is authorized (Admin or Base Commander of asset's base)
        if (!assignedBy.isAdmin() && !assignedBy.getBaseId().equals(asset.getBase().getId())) {
            throw new BusinessRuleViolationException("Not authorized to assign assets for this base");
        }

        // Check if personnel belongs to the same base (optional business rule)
        if (!personnel.getBase().getId().equals(asset.getBase().getId())) {
            throw new BusinessRuleViolationException("Personnel must belong to the same base as the asset");
        }

        Assignment assignment = Assignment.builder()
                .asset(asset)
                .personnel(personnel)
                .assignedDate(request.getAssignedDate())
                .expectedReturnDate(request.getExpectedReturnDate())
                .status(Assignment.Status.ACTIVE)
                .assignedBy(assignedBy)
                .notes(request.getNotes())
                .build();

        // Update asset status to ASSIGNED
        asset.setStatus(Asset.Status.ASSIGNED);
        assetRepository.save(asset);

        Assignment savedAssignment = assignmentRepository.save(assignment);
        return mapToResponse(savedAssignment);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AssignmentResponse> getAssignments(Long assetId, Long personnelId, Assignment.Status status,
                                                            LocalDate startDate, LocalDate endDate,
                                                            int page, int size, String sortBy, String sortDir,
                                                            String username) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Page<Assignment> assignmentPage;

        if (user.isAdmin()) {
            // Admin can view all assignments
            assignmentPage = assignmentRepository.findWithFilters(
                    assetId, personnelId, status, startDate, endDate, pageable);
        } else {
            // Base Commander and Logistics Officer can only view their assigned base
            assignmentPage = assignmentRepository.findWithFiltersAndBase(
                    user.getBaseId(), assetId, personnelId, status, startDate, endDate, pageable);
        }

        return PageResponse.of(assignmentPage.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public AssignmentResponse getAssignmentById(Long id, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        if (!user.isAdmin()
                && !Objects.equals(
                        user.getBaseId(),
                        assignment.getAsset().getBase().getId())) {

            throw new BusinessRuleViolationException(
                    "Not authorized to view this assignment"
                 );
        }
        return mapToResponse(assignment);
    }

    @Override
    @Transactional
    public AssignmentResponse returnAsset(Long id, LocalDate returnedDate, String username) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        if (Assignment.Status.ACTIVE != assignment.getStatus()) {
            throw new BusinessRuleViolationException("Can only return assets with ACTIVE assignment status");
        }

        User returnedBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        // Check if user is authorized (Admin or Base Commander of asset's base)
        if (!returnedBy.isAdmin()
                && !Objects.equals(returnedBy.getBaseId(), assignment.getAsset().getBase().getId())) {
            throw new BusinessRuleViolationException(
                    "Not authorized to return assets for this base");
        }

        assignment.setStatus(Assignment.Status.RETURNED);
        assignment.setReturnedDate(returnedDate);
        assignment.setReturnedBy(returnedBy);

        // Update asset status back to AVAILABLE
        Asset asset = assignment.getAsset();
        asset.setStatus(Asset.Status.AVAILABLE);
        assetRepository.save(asset);

        Assignment savedAssignment = assignmentRepository.save(assignment);
        return mapToResponse(savedAssignment);
    }

    private AssignmentResponse mapToResponse(Assignment assignment) {
        return AssignmentResponse.builder()
                .id(assignment.getId())
                .assetId(assignment.getAsset().getId())
                .assetSerialNumber(assignment.getAsset().getSerialNumber())
                .equipmentTypeId(assignment.getAsset().getEquipmentType().getId())
                .equipmentTypeCode(assignment.getAsset().getEquipmentType().getCode())
                .equipmentTypeName(assignment.getAsset().getEquipmentType().getName())
                .personnelId(assignment.getPersonnel().getId())
                .personnelServiceNumber(assignment.getPersonnel().getServiceNumber())
                .personnelFullName(assignment.getPersonnel().getFullName())
                .personnelRank(assignment.getPersonnel().getRank())
                .personnelUnit(assignment.getPersonnel().getUnit())
                .baseId(assignment.getAsset().getBase().getId())
                .baseCode(assignment.getAsset().getBase().getCode())
                .baseName(assignment.getAsset().getBase().getName())
                .assignedDate(assignment.getAssignedDate())
                .expectedReturnDate(assignment.getExpectedReturnDate())
                .returnedDate(assignment.getReturnedDate())
                .status(assignment.getStatus())
                .assignedBy(assignment.getAssignedBy().getUsername())
                .returnedBy(assignment.getReturnedBy() != null ? assignment.getReturnedBy().getUsername() : null)
                .notes(assignment.getNotes())
                .createdAt(assignment.getCreatedAt())
                .updatedAt(assignment.getUpdatedAt())
                .build();
    }
}