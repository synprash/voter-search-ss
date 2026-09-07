-- Migration: Normalize Assemblies and Polling Stations
-- 1. Creates dedicated 'assemblies' and 'polling_stations' tables
-- 2. Adds foreign keys 'assembly_id' and 'polling_station_id' to 'voters'
-- 3. Migrates and links all existing 1,263 voter records
-- 4. Creates 'voters_view' for backward-compatible joined querying

-- 1. Assembly Details Table
CREATE TABLE IF NOT EXISTS assemblies (
    id SERIAL PRIMARY KEY,
    assembly_no INTEGER NOT NULL UNIQUE,
    assembly_name_en TEXT NOT NULL,
    assembly_name_mr TEXT NOT NULL,
    parliamentary_no INTEGER,
    parliamentary_name_en TEXT,
    parliamentary_name_mr TEXT,
    district_en TEXT,
    district_mr TEXT,
    state_en TEXT DEFAULT 'Maharashtra',
    state_mr TEXT DEFAULT 'महाराष्ट्र',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Polling Stations Table
CREATE TABLE IF NOT EXISTS polling_stations (
    id SERIAL PRIMARY KEY,
    assembly_id INTEGER REFERENCES assemblies(id) ON DELETE RESTRICT,
    assembly_no INTEGER NOT NULL,
    part_no INTEGER NOT NULL,
    station_name_en TEXT NOT NULL,
    station_name_mr TEXT NOT NULL,
    station_address_en TEXT,
    station_address_mr TEXT,
    building_name_en TEXT,
    building_name_mr TEXT,
    town_village_en TEXT,
    town_village_mr TEXT,
    taluka_en TEXT,
    taluka_mr TEXT,
    district_en TEXT,
    district_mr TEXT,
    pincode TEXT,
    total_electors INTEGER DEFAULT 0,
    male_electors INTEGER DEFAULT 0,
    female_electors INTEGER DEFAULT 0,
    third_gender_electors INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_assembly_part UNIQUE (assembly_no, part_no)
);

-- 3. Populate Assemblies from existing Booths data
INSERT INTO assemblies (
    assembly_no, assembly_name_en, assembly_name_mr,
    parliamentary_no, parliamentary_name_en, parliamentary_name_mr,
    district_en, district_mr
)
SELECT DISTINCT
    b.assembly_constituency_no,
    b.assembly_name_en,
    b.assembly_name_mr,
    b.parliamentary_constituency_no,
    b.parliamentary_name_en,
    b.parliamentary_name_mr,
    b.district_en,
    b.district_mr
FROM booths b
ON CONFLICT (assembly_no) DO UPDATE SET
    assembly_name_en = EXCLUDED.assembly_name_en,
    assembly_name_mr = EXCLUDED.assembly_name_mr,
    parliamentary_name_en = EXCLUDED.parliamentary_name_en,
    parliamentary_name_mr = EXCLUDED.parliamentary_name_mr;

-- 4. Populate Polling Stations from existing Booths data
INSERT INTO polling_stations (
    assembly_id, assembly_no, part_no,
    station_name_en, station_name_mr,
    station_address_en, station_address_mr,
    town_village_en, town_village_mr,
    taluka_en, taluka_mr,
    district_en, district_mr,
    pincode,
    total_electors, male_electors, female_electors, third_gender_electors
)
SELECT 
    a.id,
    b.assembly_constituency_no,
    b.part_no,
    b.polling_station_name_en,
    b.polling_station_name_mr,
    b.polling_station_address_en,
    b.polling_station_address_mr,
    b.town_village_en,
    b.town_village_mr,
    b.taluka_en,
    b.taluka_mr,
    b.district_en,
    b.district_mr,
    b.pincode,
    b.total_electors,
    b.male_electors,
    b.female_electors,
    b.third_gender_electors
FROM booths b
JOIN assemblies a ON b.assembly_constituency_no = a.assembly_no
ON CONFLICT (assembly_no, part_no) DO UPDATE SET
    station_name_en = EXCLUDED.station_name_en,
    station_name_mr = EXCLUDED.station_name_mr,
    station_address_en = EXCLUDED.station_address_en,
    station_address_mr = EXCLUDED.station_address_mr;

-- 5. Add Foreign Keys to Voters Table
ALTER TABLE voters ADD COLUMN IF NOT EXISTS assembly_id INTEGER REFERENCES assemblies(id);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS polling_station_id INTEGER REFERENCES polling_stations(id);

CREATE INDEX IF NOT EXISTS idx_voters_assembly_id ON voters (assembly_id);
CREATE INDEX IF NOT EXISTS idx_voters_polling_station_id ON voters (polling_station_id);

-- Backfill foreign keys for all existing voters
UPDATE voters v
SET assembly_id = a.id
FROM assemblies a
WHERE v.assembly_no = a.assembly_no
  AND (v.assembly_id IS NULL OR v.assembly_id != a.id);

UPDATE voters v
SET polling_station_id = ps.id
FROM polling_stations ps
WHERE v.assembly_no = ps.assembly_no AND v.part_no = ps.part_no
  AND (v.polling_station_id IS NULL OR v.polling_station_id != ps.id);

-- 6. Create High-Performance Joined View for Backwards Compatibility
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
    -- Normalized Assembly Details
    COALESCE(a.assembly_no, v.assembly_no) AS assembly_no,
    COALESCE(a.assembly_name_en, v.assembly_name_en) AS assembly_name_en,
    COALESCE(a.assembly_name_mr, v.assembly_name_mr) AS assembly_name_mr,
    COALESCE(a.parliamentary_no, v.parliamentary_no) AS parliamentary_no,
    COALESCE(a.parliamentary_name_en, v.parliamentary_name_en) AS parliamentary_name_en,
    COALESCE(a.parliamentary_name_mr, v.parliamentary_name_mr) AS parliamentary_name_mr,
    -- Normalized Polling Station Details
    COALESCE(ps.part_no, v.part_no) AS part_no,
    COALESCE(ps.station_name_en, v.polling_station_en) AS polling_station_en,
    COALESCE(ps.station_name_mr, v.polling_station_mr) AS polling_station_mr
FROM voters v
LEFT JOIN assemblies a ON v.assembly_id = a.id
LEFT JOIN polling_stations ps ON v.polling_station_id = ps.id;

-- 7. Row Level Security Policies
ALTER TABLE assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE polling_stations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assemblies' AND policyname = 'Allow public read on assemblies') THEN
        CREATE POLICY "Allow public read on assemblies" ON assemblies FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'polling_stations' AND policyname = 'Allow public read on polling_stations') THEN
        CREATE POLICY "Allow public read on polling_stations" ON polling_stations FOR SELECT USING (true);
    END IF;
END $$;
