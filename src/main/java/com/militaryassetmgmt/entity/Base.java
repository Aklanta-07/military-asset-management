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
@Table(name = "bases")
@SequenceGenerator(name = "base_seq", sequenceName = "seq_bases", allocationSize = 1)
public class Base extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "base_seq")
    @Column(name = "id", nullable = false)
    private Long id;

    @NotBlank
    @Size(max = 20)
    @Column(name = "code", nullable = false, unique = true, length = 20)
    private String code;

    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Size(max = 255)
    @Column(name = "location", length = 255)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commander_id", referencedColumnName = "id")
    @ToString.Exclude
    private User commander;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Integer active = 1;

    @Builder.Default
    @OneToMany(mappedBy = "base", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<User> users = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "base", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Personnel> personnel = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "base", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Asset> assets = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "base", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Purchase> purchases = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "fromBase", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Transfer> transfersFrom = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "toBase", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Transfer> transfersTo = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "base", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Expenditure> expenditures = new HashSet<>();

    public boolean isActive() {
        return active != null && active == 1;
    }
}