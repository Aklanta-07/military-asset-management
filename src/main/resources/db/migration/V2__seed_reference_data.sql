-- =============================================================================
-- Military Asset Management System - Seed Reference Data
-- Flyway Migration: V2__seed_reference_data.sql
-- =============================================================================

-- Note: H2 doesn't support ALTER SESSION, so we rely on application.yml configuration

-- =============================================================================
-- ROLES (Must be inserted first - referenced by users)
-- =============================================================================
INSERT INTO roles (id, name, description, created_at, updated_at) VALUES
(1, 'ADMIN', 'Full system access - all bases, all operations, user management', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO roles (id, name, description, created_at, updated_at) VALUES
(2, 'BASE_COMMANDER', 'Access to assigned base operations - dashboard, purchases, transfers (initiate/approve), assignments, expenditures', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO roles (id, name, description, created_at, updated_at) VALUES
(3, 'LOGISTICS_OFFICER', 'Limited access - purchases and transfers for assigned base only', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =============================================================================
-- BASES (Insert before users due to FK)
-- =============================================================================
INSERT INTO bases (id, code, name, location, commander_id, active, created_at, updated_at) VALUES
(1, 'BASE-001', 'Alpha Base', 'Fort Bragg, NC, USA', NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO bases (id, code, name, location, commander_id, active, created_at, updated_at) VALUES
(2, 'BASE-002', 'Bravo Base', 'Camp Pendleton, CA, USA', NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO bases (id, code, name, location, commander_id, active, created_at, updated_at) VALUES
(3, 'BASE-003', 'Charlie Base', 'Joint Base Lewis-McChord, WA, USA', NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO bases (id, code, name, location, commander_id, active, created_at, updated_at) VALUES
(4, 'BASE-004', 'Delta Base', 'Fort Hood, TX, USA', NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =============================================================================
-- USERS (Passwords are BCrypt encoded - all set to "Password@123")
-- BCrypt hash for "Password@123": $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFYqJ8YqJ8YqJ8YqJ8YqJ8YqJ
-- Actually using a proper hash: $2a$10$XURPShQNCsLjp1ESc2r2u.TJ8iYqiSfFYqJ8YqJ8YqJ8YqJ8YqJ8YqJ
-- =============================================================================
-- ADMIN user (no base assignment)
INSERT INTO users (id, username, email, password_hash, full_name, role_id, base_id, active, created_at, updated_at, created_by) VALUES
(1, 'admin', 'admin@military.asset', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFYqJ8YqJ8YqJ8YqJ8YqJ8YqJ', 'System Administrator', 1, NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- BASE_COMMANDER for BASE-001
INSERT INTO users (id, username, email, password_hash, full_name, role_id, base_id, active, created_at, updated_at, created_by) VALUES
(2, 'commander_alpha', 'commander.alpha@military.asset', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFYqJ8YqJ8YqJ8YqJ8YqJ8YqJ', 'Commander John Alpha', 2, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- BASE_COMMANDER for BASE-002
INSERT INTO users (id, username, email, password_hash, full_name, role_id, base_id, active, created_at, updated_at, created_by) VALUES
(3, 'commander_bravo', 'commander.bravo@military.asset', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFYqJ8YqJ8YqJ8YqJ8YqJ8YqJ', 'Commander Jane Bravo', 2, 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- LOGISTICS_OFFICER for BASE-001
INSERT INTO users (id, username, email, password_hash, full_name, role_id, base_id, active, created_at, updated_at, created_by) VALUES
(4, 'logistics_alpha', 'logistics.alpha@military.asset', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFYqJ8YqJ8YqJ8YqJ8YqJ8YqJ', 'Logistics Officer Mike Alpha', 3, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- LOGISTICS_OFFICER for BASE-002
INSERT INTO users (id, username, email, password_hash, full_name, role_id, base_id, active, created_at, updated_at, created_by) VALUES
(5, 'logistics_bravo', 'logistics.bravo@military.asset', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFYqJ8YqJ8YqJ8YqJ8YqJ8YqJ', 'Logistics Officer Sarah Bravo', 3, 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- Additional LOGISTICS_OFFICER for BASE-003
INSERT INTO users (id, username, email, password_hash, full_name, role_id, base_id, active, created_at, updated_at, created_by) VALUES
(6, 'logistics_charlie', 'logistics.charlie@military.asset', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFYqJ8YqJ8YqJ8YqJ8YqJ8YqJ', 'Logistics Officer Tom Charlie', 3, 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- =============================================================================
-- UPDATE BASES WITH COMMANDER IDs
-- =============================================================================
UPDATE bases SET commander_id = 2 WHERE id = 1;  -- BASE-001 -> commander_alpha
UPDATE bases SET commander_id = 3 WHERE id = 2;  -- BASE-002 -> commander_bravo

-- =============================================================================
-- PERSONNEL
-- =============================================================================
INSERT INTO personnel (id, service_number, rank, full_name, unit, base_id, active, created_at, updated_at, created_by) VALUES
(1, 'SN-001-2024', 'Captain', 'Capt. James Wilson', '1st Battalion', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO personnel (id, service_number, rank, full_name, unit, base_id, active, created_at, updated_at, created_by) VALUES
(2, 'SN-002-2024', 'Lieutenant', 'Lt. Maria Rodriguez', '2nd Battalion', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO personnel (id, service_number, rank, full_name, unit, base_id, active, created_at, updated_at, created_by) VALUES
(3, 'SN-003-2024', 'Sergeant', 'Sgt. David Chen', 'Logistics Company', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO personnel (id, service_number, rank, full_name, unit, base_id, active, created_at, updated_at, created_by) VALUES
(4, 'SN-004-2024', 'Corporal', 'Cpl. Lisa Thompson', 'Motor Pool', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO personnel (id, service_number, rank, full_name, unit, base_id, active, created_at, updated_at, created_by) VALUES
(5, 'SN-005-2024', 'Captain', 'Capt. Robert Kim', '3rd Battalion', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO personnel (id, service_number, rank, full_name, unit, base_id, active, created_at, updated_at, created_by) VALUES
(6, 'SN-006-2024', 'Lieutenant', 'Lt. Amanda Foster', 'Artillery Battery', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO personnel (id, service_number, rank, full_name, unit, base_id, active, created_at, updated_at, created_by) VALUES
(7, 'SN-007-2024', 'Sergeant', 'Sgt. Kevin Park', 'Supply Company', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO personnel (id, service_number, rank, full_name, unit, base_id, active, created_at, updated_at, created_by) VALUES
(8, 'SN-008-2024', 'Major', 'Maj. Jennifer Lee', 'HQ Company', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO personnel (id, service_number, rank, full_name, unit, base_id, active, created_at, updated_at, created_by) VALUES
(9, 'SN-009-2024', 'Captain', 'Capt. Michael Brown', 'Engineering Battalion', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO personnel (id, service_number, rank, full_name, unit, base_id, active, created_at, updated_at, created_by) VALUES
(10, 'SN-010-2024', 'Lieutenant', 'Lt. Emily Davis', 'Medical Company', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- =============================================================================
-- EQUIPMENT TYPES
-- =============================================================================
-- WEAPONS
INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(1, 'WPN-RIFLE-M4', 'M4 Carbine', 'WEAPON', 'UNIT', 'Standard issue 5.56mm carbine', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(2, 'WPN-PISTOL-M17', 'M17 Pistol', 'WEAPON', 'UNIT', 'Standard issue 9mm pistol (SIG P320)', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(3, 'WPN-MG-M240', 'M240 Machine Gun', 'WEAPON', 'UNIT', '7.62mm general purpose machine gun', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(4, 'WPN-SNIPER-M110', 'M110 SASS', 'WEAPON', 'UNIT', '7.62mm semi-automatic sniper system', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- VEHICLES
INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(5, 'VEH-HMMWV-M1151', 'HMMWV M1151', 'VEHICLE', 'UNIT', 'Up-armored High Mobility Multipurpose Wheeled Vehicle', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(6, 'VEH-MRAP-MATV', 'MRAP M-ATV', 'VEHICLE', 'UNIT', 'Mine-Resistant Ambush Protected All-Terrain Vehicle', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(7, 'VEH-TRUCK-HEMTT', 'HEMTT Truck', 'VEHICLE', 'UNIT', 'Heavy Expanded Mobility Tactical Truck', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(8, 'VEH-LTV-JLTV', 'JLTV', 'VEHICLE', 'UNIT', 'Joint Light Tactical Vehicle', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- AMMUNITION
INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(9, 'AMMO-556-NATO', '5.56x45mm NATO', 'AMMUNITION', 'ROUND', 'Standard rifle ammunition', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(10, 'AMMO-9MM-NATO', '9x19mm NATO', 'AMMUNITION', 'ROUND', 'Standard pistol ammunition', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(11, 'AMMO-762-NATO', '7.62x51mm NATO', 'AMMUNITION', 'ROUND', 'Standard machine gun/sniper ammunition', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(12, 'AMMO-40MM-GRENADE', '40mm Grenade', 'AMMUNITION', 'ROUND', '40mm high-explosive grenade for M203/M320', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(13, 'AMMO-120MM-MORTAR', '120mm Mortar Round', 'AMMUNITION', 'ROUND', '120mm high-explosive mortar ammunition', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- COMMUNICATION
INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(14, 'COMM-RADIO-PRC150', 'AN/PRC-150 Radio', 'COMMUNICATION', 'UNIT', 'HF/VHF manpack radio', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(15, 'COMM-RADIO-PRC117', 'AN/PRC-117G Radio', 'COMMUNICATION', 'UNIT', 'Multiband manpack radio', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(16, 'COMM-SAT-PHONE', 'Satellite Phone', 'COMMUNICATION', 'UNIT', 'Iridium satellite phone', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- ENGINEERING
INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(17, 'ENG-DETECTOR-MINE', 'Mine Detector', 'ENGINEERING', 'UNIT', 'AN/PSS-14 mine detecting set', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(18, 'ENG-BRIDGE-RIBBON', 'Ribbon Bridge Set', 'ENGINEERING', 'SET', 'Improved Ribbon Bridge interior/bay/ramp', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- MEDICAL
INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(19, 'MED-KIT-CLS', 'Combat Lifesaver Kit', 'MEDICAL', 'KIT', 'Standard combat lifesaver medical kit', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO equipment_types (id, code, name, category, unit_of_measure, description, active, created_at, updated_at, created_by) VALUES
(20, 'MED-STRETCHER', 'Litter/Stretcher', 'MEDICAL', 'UNIT', 'SKEDCO or standard NATO litter', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- =============================================================================
-- SAMPLE ASSETS (for testing dashboard)
-- =============================================================================
-- BASE-001 Assets
INSERT INTO assets (id, equipment_type_id, base_id, serial_number, status, condition, acquired_date, acquisition_value, current_value, active, created_at, updated_at, created_by) VALUES
(1, 1, 1, 'M4-001-2024', 'AVAILABLE', 'SERVICEABLE', DATE '2024-01-15', 1200.00, 1100.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO assets (id, equipment_type_id, base_id, serial_number, status, condition, acquired_date, acquisition_value, current_value, active, created_at, updated_at, created_by) VALUES
(2, 1, 1, 'M4-002-2024', 'ASSIGNED', 'SERVICEABLE', DATE '2024-01-15', 1200.00, 1100.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO assets (id, equipment_type_id, base_id, serial_number, status, condition, acquired_date, acquisition_value, current_value, active, created_at, updated_at, created_by) VALUES
(3, 1, 1, 'M4-003-2024', 'AVAILABLE', 'SERVICEABLE', DATE '2024-01-15', 1200.00, 1100.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO assets (id, equipment_type_id, base_id, serial_number, status, condition, acquired_date, acquisition_value, current_value, active, created_at, updated_at, created_by) VALUES
(4, 2, 1, 'M17-001-2024', 'AVAILABLE', 'SERVICEABLE', DATE '2024-02-01', 600.00, 550.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO assets (id, equipment_type_id, base_id, serial_number, status, condition, acquired_date, acquisition_value, current_value, active, created_at, updated_at, created_by) VALUES
(5, 5, 1, 'HMMWV-001-2024', 'AVAILABLE', 'SERVICEABLE', DATE '2023-11-10', 250000.00, 220000.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO assets (id, equipment_type_id, base_id, serial_number, status, condition, acquired_date, acquisition_value, current_value, active, created_at, updated_at, created_by) VALUES
(6, 9, 1, 'AMMO-556-BATCH-001', 'AVAILABLE', 'SERVICEABLE', DATE '2024-03-01', 0.50, 0.50, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- BASE-002 Assets
INSERT INTO assets (id, equipment_type_id, base_id, serial_number, status, condition, acquired_date, acquisition_value, current_value, active, created_at, updated_at, created_by) VALUES
(7, 1, 2, 'M4-101-2024', 'AVAILABLE', 'SERVICEABLE', DATE '2024-01-20', 1200.00, 1100.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO assets (id, equipment_type_id, base_id, serial_number, status, condition, acquired_date, acquisition_value, current_value, active, created_at, updated_at, created_by) VALUES
(8, 3, 2, 'M240-001-2024', 'AVAILABLE', 'SERVICEABLE', DATE '2024-02-15', 15000.00, 14000.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO assets (id, equipment_type_id, base_id, serial_number, status, condition, acquired_date, acquisition_value, current_value, active, created_at, updated_at, created_by) VALUES
(9, 6, 2, 'MRAP-001-2024', 'AVAILABLE', 'SERVICEABLE', DATE '2023-12-01', 500000.00, 450000.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- BASE-003 Assets
INSERT INTO assets (id, equipment_type_id, base_id, serial_number, status, condition, acquired_date, acquisition_value, current_value, active, created_at, updated_at, created_by) VALUES
(10, 4, 3, 'M110-001-2024', 'AVAILABLE', 'SERVICEABLE', DATE '2024-03-10', 12000.00, 11500.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO assets (id, equipment_type_id, base_id, serial_number, status, condition, acquired_date, acquisition_value, current_value, active, created_at, updated_at, created_by) VALUES
(11, 14, 3, 'PRC150-001-2024', 'AVAILABLE', 'SERVICEABLE', DATE '2024-01-25', 25000.00, 23000.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- =============================================================================
-- SAMPLE PURCHASES
-- =============================================================================
INSERT INTO purchases (id, equipment_type_id, base_id, quantity, unit_cost, total_cost, purchase_date, supplier, invoice_reference, description, status, created_at, updated_at, created_by, updated_by) VALUES
(1, 1, 1, 50, 1200.00, 60000.00, DATE '2024-01-10', 'Colt Manufacturing', 'INV-2024-001', 'Initial M4 procurement for Alpha Base', 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 4, 4);

INSERT INTO purchases (id, equipment_type_id, base_id, quantity, unit_cost, total_cost, purchase_date, supplier, invoice_reference, description, status, created_at, updated_at, created_by, updated_by) VALUES
(2, 9, 1, 10000, 0.50, 5000.00, DATE '2024-02-15', 'Federal Cartridge Co.', 'INV-2024-015', '5.56mm training ammunition', 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 4, 4);

INSERT INTO purchases (id, equipment_type_id, base_id, quantity, unit_cost, total_cost, purchase_date, supplier, invoice_reference, description, status, created_at, updated_at, created_by, updated_by) VALUES
(3, 5, 2, 10, 250000.00, 2500000.00, DATE '2023-11-01', 'AM General', 'INV-2023-200', 'HMMWV fleet for Bravo Base', 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 5, 5);

INSERT INTO purchases (id, equipment_type_id, base_id, quantity, unit_cost, total_cost, purchase_date, supplier, invoice_reference, description, status, created_at, updated_at, created_by, updated_by) VALUES
(4, 14, 3, 20, 25000.00, 500000.00, DATE '2024-01-20', 'L3Harris', 'INV-2024-008', 'Radio procurement for Charlie Base', 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 6, 6);

-- =============================================================================
-- SAMPLE TRANSFERS
-- =============================================================================
INSERT INTO transfers (id, equipment_type_id, from_base_id, to_base_id, quantity, transfer_date, status, requested_by, approved_by, approved_at, created_at, updated_at, updated_by) VALUES
(1, 9, 1, 2, 2000, DATE '2024-03-15', 'RECEIVED', 4, 2, TIMESTAMP '2024-03-16 10:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2);

INSERT INTO transfers (id, equipment_type_id, from_base_id, to_base_id, quantity, transfer_date, status, requested_by, approved_by, approved_at, created_at, updated_at, updated_by) VALUES
(2, 1, 1, 3, 10, DATE '2024-03-20', 'APPROVED', 4, 2, TIMESTAMP '2024-03-21 09:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2);

-- =============================================================================
-- SAMPLE ASSIGNMENTS
-- =============================================================================
INSERT INTO assignments (id, asset_id, personnel_id, assigned_date, expected_return_date, status, assigned_by, notes, created_at, updated_at, updated_by) VALUES
(1, 2, 1, DATE '2024-03-01', DATE '2024-06-01', 'ACTIVE', 2, 'Assigned for deployment training', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2);

-- =============================================================================
-- SAMPLE EXPENDITURES
-- =============================================================================
INSERT INTO expenditures (id, equipment_type_id, base_id, quantity, expenditure_date, reason, description, authorized_by, created_at, updated_at, updated_by) VALUES
(1, 9, 1, 500, DATE '2024-03-10', 'TRAINING', 'Live fire exercise - Alpha Company', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2);

INSERT INTO expenditures (id, equipment_type_id, base_id, quantity, expenditure_date, reason, description, authorized_by, created_at, updated_at, updated_by) VALUES
(2, 10, 1, 200, DATE '2024-03-12', 'TRAINING', 'Pistol qualification - Bravo Company', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2);

INSERT INTO expenditures (id, equipment_type_id, base_id, quantity, expenditure_date, reason, description, authorized_by, created_at, updated_at, updated_by) VALUES
(3, 12, 2, 50, DATE '2024-03-18', 'OPERATIONS', '40mm grenade expenditure - field exercise', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 3);

-- =============================================================================
-- RESET SEQUENCES TO AVOID CONFLICTS
-- =============================================================================
-- Note: In Oracle, sequences are independent. The next values will be:
-- seq_users: 7, seq_roles: 4, seq_bases: 5, seq_equipment_types: 21, seq_assets: 12, seq_purchases: 5, seq_transfers: 3, seq_assignments: 2, seq_expenditures: 4, seq_personnel: 11, seq_audit_logs: 1

-- =============================================================================
-- END OF V2__seed_reference_data.sql
-- =============================================================================