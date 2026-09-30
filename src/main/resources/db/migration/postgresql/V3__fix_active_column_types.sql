-- =============================================================================
-- V3: FIX ACTIVE COLUMN TYPES
-- =============================================================================
-- Java entities use Integer for the active field.
-- PostgreSQL V1 initially created these columns as SMALLINT.
-- Hibernate schema validation therefore expects INTEGER but finds SMALLINT.
--
-- The views must be dropped before altering assets.active because
-- v_stock_balances depends on that column.
-- v_dashboard_summary depends on v_stock_balances.
-- =============================================================================


-- =============================================================================
-- 1. DROP DEPENDENT VIEWS
-- =============================================================================

DROP VIEW IF EXISTS v_dashboard_summary;
DROP VIEW IF EXISTS v_stock_balances;


-- =============================================================================
-- 2. ALTER ACTIVE COLUMN TYPES
-- =============================================================================

ALTER TABLE bases
    ALTER COLUMN active TYPE INTEGER
    USING active::INTEGER;

ALTER TABLE users
    ALTER COLUMN active TYPE INTEGER
    USING active::INTEGER;

ALTER TABLE personnel
    ALTER COLUMN active TYPE INTEGER
    USING active::INTEGER;

ALTER TABLE equipment_types
    ALTER COLUMN active TYPE INTEGER
    USING active::INTEGER;

ALTER TABLE assets
    ALTER COLUMN active TYPE INTEGER
    USING active::INTEGER;


-- =============================================================================
-- 3. RECREATE STOCK BALANCES VIEW
-- =============================================================================

CREATE OR REPLACE VIEW v_stock_balances AS
SELECT
    b.id AS base_id,
    b.code AS base_code,
    b.name AS base_name,

    et.id AS equipment_type_id,
    et.code AS equipment_type_code,
    et.name AS equipment_type_name,
    et.category AS equipment_category,

    -- Opening / current asset balance
    COALESCE((
        SELECT COUNT(*)
        FROM assets a
        WHERE a.base_id = b.id
          AND a.equipment_type_id = et.id
          AND a.active = 1
          AND a.status NOT IN ('EXPENDED', 'DISPOSED')
    ), 0) AS opening_balance,

    -- Current Balance
    COALESCE((
        SELECT COUNT(*)
        FROM assets a
        WHERE a.base_id = b.id
          AND a.equipment_type_id = et.id
          AND a.active = 1
          AND a.status NOT IN ('EXPENDED', 'DISPOSED')
    ), 0) AS current_balance,

    -- Purchases in last 30 days
    COALESCE((
        SELECT SUM(p.quantity)
        FROM purchases p
        WHERE p.base_id = b.id
          AND p.equipment_type_id = et.id
          AND p.status = 'COMPLETED'
          AND p.purchase_date >= CURRENT_DATE - 30
    ), 0) AS purchases_qty,

    -- Transfers In
    COALESCE((
        SELECT SUM(t.quantity)
        FROM transfers t
        WHERE t.to_base_id = b.id
          AND t.equipment_type_id = et.id
          AND t.status IN ('RECEIVED', 'IN_TRANSIT')
          AND t.transfer_date >= CURRENT_DATE - 30
    ), 0) AS transfers_in_qty,

    -- Transfers Out
    COALESCE((
        SELECT SUM(t.quantity)
        FROM transfers t
        WHERE t.from_base_id = b.id
          AND t.equipment_type_id = et.id
          AND t.status IN (
              'APPROVED',
              'IN_TRANSIT',
              'RECEIVED'
          )
          AND t.transfer_date >= CURRENT_DATE - 30
    ), 0) AS transfers_out_qty,

    -- Active Assignments
    COALESCE((
        SELECT COUNT(*)
        FROM assignments a
        JOIN assets ast
            ON a.asset_id = ast.id
        WHERE ast.base_id = b.id
          AND ast.equipment_type_id = et.id
          AND a.status = 'ACTIVE'
    ), 0) AS assigned_qty,

    -- Expenditures in last 30 days
    COALESCE((
        SELECT SUM(e.quantity)
        FROM expenditures e
        WHERE e.base_id = b.id
          AND e.equipment_type_id = et.id
          AND e.expenditure_date >= CURRENT_DATE - 30
    ), 0) AS expended_qty,

    CURRENT_TIMESTAMP AS last_calculated

FROM bases b
CROSS JOIN equipment_types et

WHERE b.active = 1
  AND et.active = 1;


COMMENT ON VIEW v_stock_balances IS
    'Real-time stock balances with movement calculations';


-- =============================================================================
-- 4. RECREATE DASHBOARD SUMMARY VIEW
-- =============================================================================

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

    (
        SUM(sb.purchases_qty)
        + SUM(sb.transfers_in_qty)
        - SUM(sb.transfers_out_qty)
    ) AS net_movement,

    SUM(sb.assigned_qty) AS total_assigned,

    SUM(sb.expended_qty) AS total_expended

FROM v_stock_balances sb

JOIN bases b
    ON sb.base_id = b.id

JOIN equipment_types et
    ON sb.equipment_type_id = et.id

WHERE b.active = 1

GROUP BY
    b.id,
    b.code,
    b.name;


COMMENT ON VIEW v_dashboard_summary IS
    'Aggregated dashboard metrics per base';


-- =============================================================================
-- END OF V3
-- =============================================================================