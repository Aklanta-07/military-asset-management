package com.militaryassetmgmt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
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

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@Entity
@Table(name = "audit_logs")
@SequenceGenerator(name = "audit_log_seq", sequenceName = "seq_audit_logs", allocationSize = 1)
public class AuditLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "audit_log_seq")
    @Column(name = "id", nullable = false)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @NotBlank
    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 30)
    private Action action;

    @Lob
    @Column(name = "old_values")
    private String oldValues;

    @Lob
    @Column(name = "new_values")
    private String newValues;

    @Size(max = 1000)
    @Column(name = "changed_fields", length = 1000)
    private String changedFields;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    @ToString.Exclude
    private User performedBy;

    @Builder.Default
    @Column(name = "performed_at", nullable = false, updatable = false)
    private Instant performedAt = Instant.now();

    @Size(max = 45)
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Size(max = 500)
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Size(max = 100)
    @Column(name = "correlation_id", length = 100)
    private String correlationId;

    @Size(max = 100)
    @Column(name = "session_id", length = 100)
    private String sessionId;

    public enum Action {
        CREATE,
        UPDATE,
        DELETE,
        APPROVE,
        RECEIVE,
        CANCEL,
        ASSIGN,
        RETURN,
        EXPEND,
        LOGIN,
        LOGOUT,
        FAILED_LOGIN
    }
}