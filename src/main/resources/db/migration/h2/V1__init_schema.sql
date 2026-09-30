-- =============================================================================
-- Flyway Migration: V1__init_schema.sql
-- =============================================================================

-- Set schema context (Note: Flyway handles default schema via application.yml; H2 doesn't support ALTER SESSION)
-- ALTER SESSION SET CURRENT_SCHEMA = MILITARY_ASSET;

-- =============================================================================
-- SEQUENCES
-- =============================================================================
CREATE SEQUENCE seq_users START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_roles START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_bases START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_equipment_types START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_assets START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_purchases START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_transfers START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_assignments START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_expenditures START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_audit_logs START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_personnel START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

-- =============================================================================
-- ROLES TABLE (Reference Data)
-- =============================================================================
CREATE TABLE roles (
    id              NUMBER(19,0) NOT NULL,
    name            VARCHAR2(50) NOT NULL,
    description     VARCHAR2(255),
    created_at      TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by      NUMBER(19,0),
    updated_by      NUMBER(19,0),
    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT uk_roles_name UNIQUE (name)
);

COMMENT ON TABLE roles IS 'System roles for RBAC';
COMMENT ON COLUMN roles.name IS 'Role identifier: ADMIN, BASE_COMMANDER, LOGISTICS_OFFICER';

-- =============================================================================
-- BASES TABLE
-- =============================================================================
CREATE TABLE bases (
    id              NUMBER(19,0) NOT NULL,
    code            VARCHAR2(20) NOT NULL,
    name            VARCHAR2(100) NOT NULL,
    location        VARCHAR2(255),
    commander_id    NUMBER(19,0),
    active          NUMBER(1,0) DEFAULT 1 NOT NULL,
    created_at      TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by      NUMBER(19,0),
    updated_by      NUMBER(19,0),
    CONSTRAINT pk_bases PRIMARY KEY (id),
    CONSTRAINT uk_bases_code UNIQUE (code),
    CONSTRAINT uk_bases_name UNIQUE (name),
    CONSTRAINT chk_bases_active CHECK (active IN (0, 1))
);

COMMENT ON TABLE bases IS 'Military bases/locations';
COMMENT ON COLUMN bases.code IS 'Short code for base (e.g., BASE-001)';
COMMENT ON COLUMN bases.commander_id IS 'FK to users table (Base Commander)';

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE users (
    id              NUMBER(19,0) NOT NULL,
    username        VARCHAR2(50) NOT NULL,
    email           VARCHAR2(100) NOT NULL,
    password_hash   VARCHAR2(255) NOT NULL,
    full_name       VARCHAR2(150) NOT NULL,
    role_id         NUMBER(19,0) NOT NULL,
    base_id         NUMBER(19,0),
    active          NUMBER(1,0) DEFAULT 1 NOT NULL,
    last_login_at   TIMESTAMP(6),
    created_at      TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by      NUMBER(19,0),
    updated_by      NUMBER(19,0),
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id),
    CONSTRAINT fk_users_base FOREIGN KEY (base_id) REFERENCES bases (id),
    CONSTRAINT chk_users_active CHECK (active IN (0, 1))
);

COMMENT ON TABLE users IS 'System users with role-based access';
COMMENT ON COLUMN users.password_hash IS 'BCrypt encoded password';
COMMENT ON COLUMN users.base_id IS 'Assigned base (NULL for ADMIN)';

-- Add FK for bases.commander_id after users table exists
ALTER TABLE bases ADD CONSTRAINT fk_bases_commander FOREIGN KEY (commander_id) REFERENCES users (id);

-- =============================================================================
-- PERSONNEL TABLE (for assignments)
-- =============================================================================
CREATE TABLE personnel (
    id              NUMBER(19,0) NOT NULL,
    service_number  VARCHAR2(30) NOT NULL,
    rank            VARCHAR2(50) NOT NULL,
    full_name       VARCHAR2(150) NOT NULL,
    unit            VARCHAR2(100),
    base_id         NUMBER(19,0) NOT NULL,
    active          NUMBER(1,0) DEFAULT 1 NOT NULL,
    created_at      TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by      NUMBER(19,0),
    updated_by      NUMBER(19,0),
    CONSTRAINT pk_personnel PRIMARY KEY (id),
    CONSTRAINT uk_personnel_service_number UNIQUE (service_number),
    CONSTRAINT fk_personnel_base FOREIGN KEY (base_id) REFERENCES bases (id),
    CONSTRAINT chk_personnel_active CHECK (active IN (0, 1))
);

COMMENT ON TABLE personnel IS 'Military personnel for asset assignments';
COMMENT ON COLUMN personnel.service_number IS 'Unique service/military ID number';

-- =============================================================================
-- EQUIPMENT TYPES TABLE (Reference Data)
-- =============================================================================
CREATE TABLE equipment_types (
    id                  NUMBER(19,0) NOT NULL,
    code                VARCHAR2(30) NOT NULL,
    name                VARCHAR2(100) NOT NULL,
    category            VARCHAR2(50) NOT NULL,
    unit_of_measure     VARCHAR2(20) DEFAULT 'UNIT' NOT NULL,
    description         VARCHAR2(500),
    active              NUMBER(1,0) DEFAULT 1 NOT NULL,
    created_at          TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by          NUMBER(19,0),
    updated_by          NUMBER(19,0),
    CONSTRAINT pk_equipment_types PRIMARY KEY (id),
    CONSTRAINT uk_equipment_types_code UNIQUE (code),
    CONSTRAINT chk_equipment_types_active CHECK (active IN (0, 1))
);

COMMENT ON TABLE equipment_types IS 'Catalog of equipment types (Weapons, Vehicles, Ammunition, etc.)';
COMMENT ON COLUMN equipment_types.category IS 'Category: WEAPON, VEHICLE, AMMUNITION, COMMUNICATION, ENGINEERING, MEDICAL, OTHER';
COMMENT ON COLUMN equipment_types.unit_of_measure IS 'Unit: UNIT, ROUND, BOX, SET, LITER, KG';

-- =============================================================================
-- ASSETS TABLE (Individual Asset Instances)
-- =============================================================================
CREATE TABLE assets (
    id                      NUMBER(19,0) NOT NULL,
    equipment_type_id       NUMBER(19,0) NOT NULL,
    base_id                 NUMBER(19,0) NOT NULL,
    serial_number           VARCHAR2(100) NOT NULL,
    status                  VARCHAR2(30) DEFAULT 'AVAILABLE' NOT NULL,
    condition               VARCHAR2(30) DEFAULT 'SERVICEABLE' NOT NULL,
    acquired_date           DATE,
    acquisition_value       NUMBER(15,2),
    current_value           NUMBER(15,2),
    notes                   VARCHAR2(1000),
    active                  NUMBER(1,0) DEFAULT 1 NOT NULL,
    created_at              TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at              TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by              NUMBER(19,0),
    updated_by              NUMBER(19,0),
    CONSTRAINT pk_assets PRIMARY KEY (id),
    CONSTRAINT uk_assets_serial UNIQUE (serial_number),
    CONSTRAINT fk_assets_equipment_type FOREIGN KEY (equipment_type_id) REFERENCES equipment_types (id),
    CONSTRAINT fk_assets_base FOREIGN KEY (base_id) REFERENCES bases (id),
    CONSTRAINT chk_assets_active CHECK (active IN (0, 1)),
    CONSTRAINT chk_assets_status CHECK (status IN ('AVAILABLE', 'ASSIGNED', 'IN_TRANSIT', 'MAINTENANCE', 'EXPENDED', 'DISPOSED')),
    CONSTRAINT chk_assets_condition CHECK (condition IN ('SERVICEABLE', 'UNSERVICEABLE', 'REPAIR_NEEDED', 'CONDITION_UNKNOWN'))
);

COMMENT ON TABLE assets IS 'Individual asset instances with serial numbers';
COMMENT ON COLUMN assets.status IS 'AVAILABLE, ASSIGNED, IN_TRANSIT, MAINTENANCE, EXPENDED, DISPOSED';
COMMENT ON COLUMN assets.condition IS 'SERVICEABLE, UNSERVICEABLE, REPAIR_NEEDED, CONDITION_UNKNOWN';

-- =============================================================================
-- PURCHASES TABLE
-- =============================================================================
CREATE TABLE purchases (
    id                  NUMBER(19,0) NOT NULL,
    equipment_type_id   NUMBER(19,0) NOT NULL,
    base_id             NUMBER(19,0) NOT NULL,
    quantity            NUMBER(10,0) NOT NULL,
    unit_cost           NUMBER(15,2) NOT NULL,
    total_cost          NUMBER(15,2) NOT NULL,
    purchase_date       DATE NOT NULL,
    supplier            VARCHAR2(200),
    invoice_reference   VARCHAR2(100),
    description         VARCHAR2(500),
    status              VARCHAR2(30) DEFAULT 'COMPLETED' NOT NULL,
    created_at          TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by          NUMBER(19,0) NOT NULL,
    updated_by          NUMBER(19,0),
    CONSTRAINT pk_purchases PRIMARY KEY (id),
    CONSTRAINT fk_purchases_equipment_type FOREIGN KEY (equipment_type_id) REFERENCES equipment_types (id),
    CONSTRAINT fk_purchases_base FOREIGN KEY (base_id) REFERENCES bases (id),
    CONSTRAINT fk_purchases_created_by FOREIGN KEY (created_by) REFERENCES users (id),
    CONSTRAINT chk_purchases_quantity CHECK (quantity > 0),
    CONSTRAINT chk_purchases_unit_cost CHECK (unit_cost >= 0),
    CONSTRAINT chk_purchases_status CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED'))
);

COMMENT ON TABLE purchases IS 'Asset purchase records';
COMMENT ON COLUMN purchases.status IS 'PENDING, COMPLETED, CANCELLED';

-- =============================================================================
-- TRANSFERS TABLE
-- =============================================================================
CREATE TABLE transfers (
    id                  NUMBER(19,0) NOT NULL,
    equipment_type_id   NUMBER(19,0) NOT NULL,
    from_base_id        NUMBER(19,0) NOT NULL,
    to_base_id          NUMBER(19,0) NOT NULL,
    quantity            NUMBER(10,0) NOT NULL,
    transfer_date       DATE NOT NULL,
    status              VARCHAR2(30) DEFAULT 'REQUESTED' NOT NULL,
    requested_by        NUMBER(19,0) NOT NULL,
    approved_by         NUMBER(19,0),
    approved_at         TIMESTAMP(6),
    received_by         NUMBER(19,0),
    received_at         TIMESTAMP(6),
    cancelled_by        NUMBER(19,0),
    cancelled_at        TIMESTAMP(6),
    cancellation_reason VARCHAR2(500),
    notes               VARCHAR2(1000),
    created_at          TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by          NUMBER(19,0),
    updated_by          NUMBER(19,0),
    CONSTRAINT pk_transfers PRIMARY KEY (id),
    CONSTRAINT fk_transfers_equipment_type FOREIGN KEY (equipment_type_id) REFERENCES equipment_types (id),
    CONSTRAINT fk_transfers_from_base FOREIGN KEY (from_base_id) REFERENCES bases (id),
    CONSTRAINT fk_transfers_to_base FOREIGN KEY (to_base_id) REFERENCES bases (id),
    CONSTRAINT fk_transfers_requested_by FOREIGN KEY (requested_by) REFERENCES users (id),
    CONSTRAINT fk_transfers_approved_by FOREIGN KEY (approved_by) REFERENCES users (id),
    CONSTRAINT fk_transfers_received_by FOREIGN KEY (received_by) REFERENCES users (id),
    CONSTRAINT fk_transfers_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users (id),
    CONSTRAINT chk_transfers_quantity CHECK (quantity > 0),
    CONSTRAINT chk_transfers_bases CHECK (from_base_id != to_base_id),
    CONSTRAINT chk_transfers_status CHECK (status IN ('REQUESTED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'))
);

COMMENT ON TABLE transfers IS 'Asset transfer records between bases';
COMMENT ON COLUMN transfers.status IS 'REQUESTED, APPROVED, IN_TRANSIT, RECEIVED, CANCELLED';

-- =============================================================================
-- ASSIGNMENTS TABLE
-- =============================================================================
CREATE TABLE assignments (
    id                  NUMBER(19,0) NOT NULL,
    asset_id            NUMBER(19,0) NOT NULL,
    personnel_id        NUMBER(19,0) NOT NULL,
    assigned_date       DATE NOT NULL,
    returned_date       DATE,
    expected_return_date DATE,
    status              VARCHAR2(30) DEFAULT 'ACTIVE' NOT NULL,
    assigned_by         NUMBER(19,0) NOT NULL,
    returned_by         NUMBER(19,0),
    notes               VARCHAR2(1000),
    created_at          TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by          NUMBER(19,0),
    updated_by          NUMBER(19,0),
    CONSTRAINT pk_assignments PRIMARY KEY (id),
    CONSTRAINT fk_assignments_asset FOREIGN KEY (asset_id) REFERENCES assets (id),
    CONSTRAINT fk_assignments_personnel FOREIGN KEY (personnel_id) REFERENCES personnel (id),
    CONSTRAINT fk_assignments_assigned_by FOREIGN KEY (assigned_by) REFERENCES users (id),
    CONSTRAINT fk_assignments_returned_by FOREIGN KEY (returned_by) REFERENCES users (id),
    CONSTRAINT chk_assignments_status CHECK (status IN ('ACTIVE', 'RETURNED', 'OVERDUE', 'LOST')),
    CONSTRAINT chk_assignments_dates CHECK (returned_date IS NULL OR returned_date >= assigned_date)
);

COMMENT ON TABLE assignments IS 'Asset assignments to personnel';
COMMENT ON COLUMN assignments.status IS 'ACTIVE, RETURNED, OVERDUE, LOST';

-- =============================================================================
-- EXPENDITURES TABLE
-- =============================================================================
CREATE TABLE expenditures (
    id                  NUMBER(19,0) NOT NULL,
    equipment_type_id   NUMBER(19,0) NOT NULL,
    base_id             NUMBER(19,0) NOT NULL,
    quantity            NUMBER(10,0) NOT NULL,
    expenditure_date    DATE NOT NULL,
    reason              VARCHAR2(100) NOT NULL,
    description         VARCHAR2(500),
    authorized_by       NUMBER(19,0) NOT NULL,
    created_at          TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by          NUMBER(19,0),
    updated_by          NUMBER(19,0),
    CONSTRAINT pk_expenditures PRIMARY KEY (id),
    CONSTRAINT fk_expenditures_equipment_type FOREIGN KEY (equipment_type_id) REFERENCES equipment_types (id),
    CONSTRAINT fk_expenditures_base FOREIGN KEY (base_id) REFERENCES bases (id),
    CONSTRAINT fk_expenditures_authorized_by FOREIGN KEY (authorized_by) REFERENCES users (id),
    CONSTRAINT chk_expenditures_quantity CHECK (quantity > 0),
    CONSTRAINT chk_expenditures_reason CHECK (reason IN ('TRAINING', 'OPERATIONS', 'TESTING', 'DISPOSAL', 'DAMAGED', 'EXPIRED', 'OTHER'))
);

COMMENT ON TABLE expenditures IS 'Asset expenditure/consumption records';
COMMENT ON COLUMN expenditures.reason IS 'TRAINING, OPERATIONS, TESTING, DISPOSAL, DAMAGED, EXPIRED, OTHER';

-- =============================================================================
-- AUDIT LOGS TABLE
-- =============================================================================
CREATE TABLE audit_logs (
    id                  NUMBER(19,0) NOT NULL,
    entity_type         VARCHAR2(100) NOT NULL,
    entity_id           NUMBER(19,0),
    action              VARCHAR2(30) NOT NULL,
    old_values          CLOB,
    new_values          CLOB,
    changed_fields      VARCHAR2(1000),
    performed_by        NUMBER(19,0),
    performed_at        TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address          VARCHAR2(45),
    user_agent          VARCHAR2(500),
    correlation_id      VARCHAR2(100),
    session_id          VARCHAR2(100),
    created_at          TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by          NUMBER(19,0),
    updated_by          NUMBER(19,0),
    CONSTRAINT pk_audit_logs PRIMARY KEY (id),
    CONSTRAINT fk_audit_logs_performed_by FOREIGN KEY (performed_by) REFERENCES users (id),
    CONSTRAINT chk_audit_action CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'RECEIVE', 'CANCEL', 'ASSIGN', 'RETURN', 'EXPEND', 'LOGIN', 'LOGOUT', 'FAILED_LOGIN'))
);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all transactions';
COMMENT ON COLUMN audit_logs.action IS 'CREATE, UPDATE, DELETE, APPROVE, RECEIVE, CANCEL, ASSIGN, RETURN, EXPEND, LOGIN, LOGOUT, FAILED_LOGIN';
COMMENT ON COLUMN audit_logs.correlation_id IS 'Request correlation ID for tracing';
COMMENT ON COLUMN audit_logs.changed_fields IS 'Comma-separated list of changed field names';

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users indexes
-- (username and email are already indexed by UNIQUE constraints)
CREATE INDEX idx_users_role_id ON users (role_id);
CREATE INDEX idx_users_base_id ON users (base_id);
CREATE INDEX idx_users_active ON users (active);

-- Bases indexes
-- (code is already indexed by UNIQUE constraint)
CREATE INDEX idx_bases_active ON bases (active);
CREATE INDEX idx_bases_commander_id ON bases (commander_id);

-- Personnel indexes
-- (service_number is already indexed by UNIQUE constraint)
CREATE INDEX idx_personnel_base_id ON personnel (base_id);
CREATE INDEX idx_personnel_active ON personnel (active);

-- Equipment Types indexes
-- (code is already indexed by UNIQUE constraint)
CREATE INDEX idx_equipment_types_category ON equipment_types (category);
CREATE INDEX idx_equipment_types_active ON equipment_types (active);

-- Assets indexes
CREATE INDEX idx_assets_equipment_type_id ON assets (equipment_type_id);
CREATE INDEX idx_assets_base_id ON assets (base_id);
-- (serial_number is already indexed by UNIQUE constraint)
CREATE INDEX idx_assets_status ON assets (status);
CREATE INDEX idx_assets_active ON assets (active);
CREATE INDEX idx_assets_base_equipment ON assets (base_id, equipment_type_id);

-- Purchases indexes
CREATE INDEX idx_purchases_equipment_type_id ON purchases (equipment_type_id);
CREATE INDEX idx_purchases_base_id ON purchases (base_id);
CREATE INDEX idx_purchases_purchase_date ON purchases (purchase_date);
CREATE INDEX idx_purchases_created_by ON purchases (created_by);
CREATE INDEX idx_purchases_status ON purchases (status);
CREATE INDEX idx_purchases_base_date ON purchases (base_id, purchase_date);

-- Transfers indexes
CREATE INDEX idx_transfers_equipment_type_id ON transfers (equipment_type_id);
CREATE INDEX idx_transfers_from_base_id ON transfers (from_base_id);
CREATE INDEX idx_transfers_to_base_id ON transfers (to_base_id);
CREATE INDEX idx_transfers_transfer_date ON transfers (transfer_date);
CREATE INDEX idx_transfers_status ON transfers (status);
CREATE INDEX idx_transfers_requested_by ON transfers (requested_by);
CREATE INDEX idx_transfers_from_to_date ON transfers (from_base_id, to_base_id, transfer_date);

-- Assignments indexes
CREATE INDEX idx_assignments_asset_id ON assignments (asset_id);
CREATE INDEX idx_assignments_personnel_id ON assignments (personnel_id);
CREATE INDEX idx_assignments_assigned_date ON assignments (assigned_date);
CREATE INDEX idx_assignments_status ON assignments (status);
CREATE INDEX idx_assignments_assigned_by ON assignments (assigned_by);

-- Expenditures indexes
CREATE INDEX idx_expenditures_equipment_type_id ON expenditures (equipment_type_id);
CREATE INDEX idx_expenditures_base_id ON expenditures (base_id);
CREATE INDEX idx_expenditures_expenditure_date ON expenditures (expenditure_date);
CREATE INDEX idx_expenditures_authorized_by ON expenditures (authorized_by);
CREATE INDEX idx_expenditures_reason ON expenditures (reason);
CREATE INDEX idx_expenditures_base_date ON expenditures (base_id, expenditure_date);

-- Audit Logs indexes
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_performed_by ON audit_logs (performed_by);
CREATE INDEX idx_audit_logs_performed_at ON audit_logs (performed_at);
CREATE INDEX idx_audit_logs_correlation_id ON audit_logs (correlation_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);

-- =============================================================================
-- VIEWS FOR DASHBOARD METRICS
-- =============================================================================

-- Stock Balance View (Opening/Closing/Net Movement)
CREATE OR REPLACE VIEW v_stock_balances AS
SELECT
    b.id AS base_id,
    b.code AS base_code,
    b.name AS base_name,
    et.id AS equipment_type_id,
    et.code AS equipment_type_code,
    et.name AS equipment_type_name,
    et.category AS equipment_category,
    -- Opening Balance (assets at start of period)
    COALESCE((
        SELECT COUNT(*)
        FROM assets a
        WHERE a.base_id = b.id
          AND a.equipment_type_id = et.id
          AND a.active = 1
          AND a.status != 'EXPENDED'
          AND a.status != 'DISPOSED'
    ), 0) AS opening_balance,
    -- Current Balance (real-time)
    COALESCE((
        SELECT COUNT(*)
        FROM assets a
        WHERE a.base_id = b.id
          AND a.equipment_type_id = et.id
          AND a.active = 1
          AND a.status NOT IN ('EXPENDED', 'DISPOSED')
    ), 0) AS current_balance,
    -- Purchases in period
    COALESCE((
        SELECT SUM(p.quantity)
        FROM purchases p
        WHERE p.base_id = b.id
          AND p.equipment_type_id = et.id
          AND p.status = 'COMPLETED'
          AND p.purchase_date >= TRUNC(SYSDATE) - 30
    ), 0) AS purchases_qty,
    -- Transfers In
    COALESCE((
        SELECT SUM(t.quantity)
        FROM transfers t
        WHERE t.to_base_id = b.id
          AND t.equipment_type_id = et.id
          AND t.status IN ('RECEIVED', 'IN_TRANSIT')
          AND t.transfer_date >= TRUNC(SYSDATE) - 30
    ), 0) AS transfers_in_qty,
    -- Transfers Out
    COALESCE((
        SELECT SUM(t.quantity)
        FROM transfers t
        WHERE t.from_base_id = b.id
          AND t.equipment_type_id = et.id
          AND t.status IN ('APPROVED', 'IN_TRANSIT', 'RECEIVED')
          AND t.transfer_date >= TRUNC(SYSDATE) - 30
    ), 0) AS transfers_out_qty,
    -- Assignments (Active)
    COALESCE((
        SELECT COUNT(*)
        FROM assignments a
        JOIN assets ast ON a.asset_id = ast.id
        WHERE ast.base_id = b.id
          AND ast.equipment_type_id = et.id
          AND a.status = 'ACTIVE'
    ), 0) AS assigned_qty,
    -- Expenditures in period
    COALESCE((
        SELECT SUM(e.quantity)
        FROM expenditures e
        WHERE e.base_id = b.id
          AND e.equipment_type_id = et.id
          AND e.expenditure_date >= TRUNC(SYSDATE) - 30
    ), 0) AS expended_qty,
    SYSDATE AS last_calculated
FROM bases b
CROSS JOIN equipment_types et
WHERE b.active = 1
  AND et.active = 1;

COMMENT ON TABLE v_stock_balances IS 'Real-time stock balances with movement calculations';

-- Dashboard Summary View
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
    b.id AS base_id,
    b.code AS base_code,
    b.name AS base_name,
    COUNT(DISTINCT et.id) AS equipment_types_count,
    SUM(sb.current_balance) AS total_assets,
    SUM(sb.purchases_qty) AS total_purchases,
    SUM(sb.transfers_in_qty) AS total_transfers_in,
    SUM(sb.transfers_out_qty) AS total_transfers_out,
    (SUM(sb.purchases_qty) + SUM(sb.transfers_in_qty) - SUM(sb.transfers_out_qty)) AS net_movement,
    SUM(sb.assigned_qty) AS total_assigned,
    SUM(sb.expended_qty) AS total_expended
FROM v_stock_balances sb
JOIN bases b ON sb.base_id = b.id
JOIN equipment_types et ON sb.equipment_type_id = et.id
WHERE b.active = 1
GROUP BY b.id, b.code, b.name;

COMMENT ON TABLE v_dashboard_summary IS 'Aggregated dashboard metrics per base';

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS (Handled by JPA @PreUpdate in BaseEntity.java)
-- =============================================================================

-- Note: PL/SQL triggers omitted for H2 compatibility; JPA @PreUpdate handles updatedAt automatically.
/*
CREATE OR REPLACE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER trg_bases_updated_at
BEFORE UPDATE ON bases
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER trg_personnel_updated_at
BEFORE UPDATE ON personnel
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER trg_equipment_types_updated_at
BEFORE UPDATE ON equipment_types
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER trg_assets_updated_at
BEFORE UPDATE ON assets
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER trg_purchases_updated_at
BEFORE UPDATE ON purchases
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER trg_transfers_updated_at
BEFORE UPDATE ON transfers
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER trg_assignments_updated_at
BEFORE UPDATE ON assignments
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER trg_expenditures_updated_at
BEFORE UPDATE ON expenditures
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/
*/

-- =============================================================================
-- GRANTS (if needed for specific users)
-- =============================================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES TO APP_USER;
-- GRANT SELECT ON ALL SEQUENCES TO APP_USER;

-- =============================================================================
-- END OF V1__init_schema.sql
-- =============================================================================