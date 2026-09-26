package com.militaryassetmgmt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@Entity
@Table(name = "transfers")
@SequenceGenerator(name = "transfer_seq", sequenceName = "seq_transfers", allocationSize = 1)
public class Transfer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "transfer_seq")
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_type_id", nullable = false)
    @ToString.Exclude
    private EquipmentType equipmentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_base_id", nullable = false)
    @ToString.Exclude
    private Base fromBase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_base_id", nullable = false)
    @ToString.Exclude
    private Base toBase;

    @NotNull
    @Positive
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @NotNull
    @Column(name = "transfer_date", nullable = false)
    private LocalDate transferDate;

    @NotBlank
    @Size(max = 30)
    @Column(name = "status", nullable = false, length = 30)
    private String status = "REQUESTED";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by", nullable = false)
    @ToString.Exclude
    private User requestedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    @ToString.Exclude
    private User approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_by")
    @ToString.Exclude
    private User receivedBy;

    @Column(name = "received_at")
    private Instant receivedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by")
    @ToString.Exclude
    private User cancelledBy;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Size(max = 500)
    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Size(max = 1000)
    @Column(name = "notes", length = 1000)
    private String notes;

    public enum Status {
        REQUESTED,
        APPROVED,
        IN_TRANSIT,
        RECEIVED,
        CANCELLED
    }

    public boolean canApprove() {
        return "REQUESTED".equals(status);
    }

    public boolean canReceive() {
        return "APPROVED".equals(status) || "IN_TRANSIT".equals(status);
    }

    public boolean canCancel() {
        return "REQUESTED".equals(status) || "APPROVED".equals(status);
    }

    public boolean isFinalState() {
        return "RECEIVED".equals(status) || "CANCELLED".equals(status);
    }
}