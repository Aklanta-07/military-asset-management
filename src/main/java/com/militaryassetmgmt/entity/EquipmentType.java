package com.militaryassetmgmt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@Entity
@Table(name = "equipment_types")
@SequenceGenerator(name = "equipment_type_seq", sequenceName = "seq_equipment_types", allocationSize = 1)
public class EquipmentType extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "equipment_type_seq")
    @Column(name = "id", nullable = false)
    private Long id;

    @NotBlank
    @Size(max = 30)
    @Column(name = "code", nullable = false, unique = true, length = 30)
    private String code;

    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private Category category;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "unit_of_measure", nullable = false, length = 20)
    private UnitOfMeasure unitOfMeasure = UnitOfMeasure.UNIT;

    @Size(max = 500)
    @Column(name = "description", length = 500)
    private String description;
    
    @Builder.Default
    @Column(name = "active", nullable = false)
    private Integer active = 1;

    @Builder.Default
    @OneToMany(mappedBy = "equipmentType", fetch = jakarta.persistence.FetchType.LAZY)
    @ToString.Exclude
    private Set<Asset> assets = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "equipmentType", fetch = jakarta.persistence.FetchType.LAZY)
    @ToString.Exclude
    private Set<Purchase> purchases = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "equipmentType", fetch = jakarta.persistence.FetchType.LAZY)
    @ToString.Exclude
    private Set<Transfer> transfers = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "equipmentType", fetch = jakarta.persistence.FetchType.LAZY)
    @ToString.Exclude
    private Set<Expenditure> expenditures = new HashSet<>();

    public boolean isActive() {
        return active != null && active == 1;
    }

    public enum Category {
        WEAPON,
        VEHICLE,
        AMMUNITION,
        COMMUNICATION,
        ENGINEERING,
        MEDICAL,
        OTHER
    }

    public enum UnitOfMeasure {
        UNIT,
        ROUND,
        BOX,
        SET,
        LITER,
        KG,
        KIT
    }
}