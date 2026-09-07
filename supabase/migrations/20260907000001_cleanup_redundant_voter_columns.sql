-- Migration: Cleanup Redundant Columns from Voters Table
-- Drops columns that are now stored in 'assemblies' and 'polling_stations' tables

-- 1. Drop existing view to prevent dependency conflict
DROP VIEW IF EXISTS voters_view CASCADE;

-- 2. Drop redundant columns from voters table
ALTER TABLE voters
  DROP COLUMN IF EXISTS assembly_name_en,
  DROP COLUMN IF EXISTS assembly_name_mr,
  DROP COLUMN IF EXISTS parliamentary_no,
  DROP COLUMN IF EXISTS parliamentary_name_en,
  DROP COLUMN IF EXISTS parliamentary_name_mr,
  DROP COLUMN IF EXISTS polling_station_en,
  DROP COLUMN IF EXISTS polling_station_mr,
  DROP COLUMN IF EXISTS assembly_no;

-- 3. Recreate voters_view with clean joined projections
CREATE OR REPLACE VIEW voters_view AS
SELECT 
    v.id,
    v.serial_no,
    v.epic_no,
    v.voter_name_en,
    v.voter_name_mr,
    v.relation_type_en,
    v.relation_type_mr,
    v.relative_name_en,
    v.relative_name_mr,
    v.house_no,
    v.address_en,
    v.address_mr,
    v.age,
    v.gender_en,
    v.gender_mr,
    v.family_id,
    v.family_role_en,
    v.family_role_mr,
    v.photo_available,
    v.pdf_page_no,
    v.audit_notes,
    v.mobile_no,
    v.section_no,
    v.section_name_en,
    v.section_name_mr,
    v.created_at,
    -- Normalized Foreign Keys
    v.assembly_id,
    v.polling_station_id,
    -- Sourced from 'assemblies' table via assembly_id
    a.assembly_no,
    a.assembly_name_en,
    a.assembly_name_mr,
    a.parliamentary_no,
    a.parliamentary_name_en,
    a.parliamentary_name_mr,
    -- Sourced from 'polling_stations' table via polling_station_id
    ps.part_no,
    ps.station_name_en AS polling_station_en,
    ps.station_name_mr AS polling_station_mr
FROM voters v
LEFT JOIN assemblies a ON v.assembly_id = a.id
LEFT JOIN polling_stations ps ON v.polling_station_id = ps.id;
