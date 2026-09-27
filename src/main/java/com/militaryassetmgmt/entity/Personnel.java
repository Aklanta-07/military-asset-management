package com.militaryassetmgmt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@Entity
@Table(name = "personnel")
@SequenceGenerator(name = "personnel_seq", sequenceName = "seq_personnel", allocationSize = 1)
public class Personnel extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "personnel_seq")
    @Column(name = "id", nullable = false)
    private Long id;

    @NotBlank
    @Size(max = 30)
    @Column(name = "service_number", nullable = false, unique = true, length = 30)
    private String serviceNumber;

    @NotBlank
    @Size(max = 50)
    @Column(name = "rank", nullable = false, length = 50)
    private String rank;

    @NotBlank
    @Size(max = 150)
    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Size(max = 100)
    @Column(name = "unit", length = 100)
    private String unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "base_id", nullable = false)
    @ToString.Exclude
    private Base base;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Integer active = 1;

    @Builder.Default
    @OneToMany(mappedBy = "personnel", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Assignment> assignments = new HashSet<>();

    public boolean isActive() {
        return active != null && active == 1;
    }

    public String getDisplayName() {
        return rank + " " + fullName + " (" + serviceNumber + ")";
    }
}