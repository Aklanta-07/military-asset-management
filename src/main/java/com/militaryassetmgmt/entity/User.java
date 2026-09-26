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
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@Entity
@Table(name = "users")
@SequenceGenerator(name = "user_seq", sequenceName = "seq_users", allocationSize = 1)
public class User extends BaseEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
    @Column(name = "id", nullable = false)
    private Long id;

    @NotBlank
    @Size(max = 50)
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @NotBlank
    @Email
    @Size(max = 100)
    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @NotBlank
    @Size(max = 255)
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @NotBlank
    @Size(max = 150)
    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "base_id")
    @ToString.Exclude
    private Base base;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Integer active = 1;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Builder.Default
    @OneToMany(mappedBy = "createdByUser", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Purchase> createdPurchases = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "requestedBy", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Transfer> requestedTransfers = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "approvedBy", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Transfer> approvedTransfers = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "receivedBy", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Transfer> receivedTransfers = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "cancelledBy", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Transfer> cancelledTransfers = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "assignedBy", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Assignment> assignedAssignments = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "returnedBy", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Assignment> returnedAssignments = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "authorizedBy", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Expenditure> authorizedExpenditures = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "performedBy", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<AuditLog> auditLogs = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "commander", fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<Base> commandedBases = new HashSet<>();

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role == null || role.getName() == null) {
            return Collections.emptyList();
        }
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.getName()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active != null && active == 1;
    }

    public boolean isAdmin() {
        return role != null && Role.RoleName.ADMIN.name().equals(role.getName());
    }

    public boolean isBaseCommander() {
        return role != null && Role.RoleName.BASE_COMMANDER.name().equals(role.getName());
    }

    public boolean isLogisticsOfficer() {
        return role != null && Role.RoleName.LOGISTICS_OFFICER.name().equals(role.getName());
    }

    public Long getBaseId() {
        return base != null ? base.getId() : null;
    }

    public String getRoleName() {
        return role != null ? role.getName() : null;
    }
}