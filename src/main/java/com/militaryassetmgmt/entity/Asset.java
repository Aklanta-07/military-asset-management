package com.militaryassetmgmt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Builder 
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@Entity
@Table(name = "assets")
@SequenceGenerator(name = "asset_seq", sequenceName = "seq_assets", allocationSize = 1)
public class Asset extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "asset_seq")
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_type_id", nullable = false)
    @ToString.Exclude
    private EquipmentType equipmentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "base_id", nullable = false)
    @ToString.Exclude
    private Base base;

    @NotBlank
    @Size(max = 100)
    @Column(name = "serial_number", nullable = false, unique = true, length = 100)
    private String serialNumber;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private Status status = Status.AVAILABLE;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "condition", nullable = false, length = 30)
    private Condition condition = Condition.SERVICEABLE;

    @Column(name = "acquired_date")
    private LocalDate acquiredDate;

    @Column(name = "acquisition_value", precision = 15, scale = 2)
    private BigDecimal acquisitionValue;

    @Column(name = "current_value", precision = 15, scale = 2)
    private BigDecimal currentValue;

    @Size(max = 1000)
    @Column(name = "notes", length = 1000)
    private String notes;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Integer active = 1;

    @Builder.Default
    @OneToMany(mappedBy = "asset", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Assignment> assignments = new HashSet<>();

    public boolean isActive() {
        return active != null && active == 1;
    }

    public boolean isAvailable() {
        return "AVAILABLE".equals(status);
    }

    public boolean isAssigned() {
        return "ASSIGNED".equals(status);
    }

    public boolean isExpended() {
        return "EXPENDED".equals(status);
    }

    public boolean isDisposed() {
        return "DISPOSED".equals(status);
    }

    public enum Status {
        AVAILABLE,
        ASSIGNED,
        IN_TRANSIT,
        MAINTENANCE,
        EXPENDED,
        DISPOSED
    }

    public enum Condition {
        SERVICEABLE,
        UNSERVICEABLE,
        REPAIR_NEEDED,
        CONDITION_UNKNOWN
    }
}