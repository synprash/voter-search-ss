-- Supabase Migration: Bilingual Voter Search Schema
-- Supports Booths, Sections, and Voters with full English + Marathi fields and full-text search indexes.

-- 1. Booths / Polling Stations Table
CREATE TABLE IF NOT EXISTS booths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_no INTEGER NOT NULL,
    assembly_constituency_no INTEGER NOT NULL,
    assembly_name_en TEXT NOT NULL,
    assembly_name_mr TEXT NOT NULL,
    parliamentary_constituency_no INTEGER NOT NULL,
    parliamentary_name_en TEXT NOT NULL,
    parliamentary_name_mr TEXT NOT NULL,
    polling_station_name_en TEXT NOT NULL,
    polling_station_name_mr TEXT NOT NULL,
    polling_station_address_en TEXT,
    polling_station_address_mr TEXT,
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
    CONSTRAINT unique_part_ac UNIQUE (assembly_constituency_no, part_no)
);

-- 2. Sections Table
CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_no INTEGER NOT NULL,
    section_no INTEGER NOT NULL,
    section_name_en TEXT NOT NULL,
    section_name_mr TEXT NOT NULL,
    CONSTRAINT unique_part_section UNIQUE (part_no, section_no)
);

-- 3. Voters Table (Bilingual)
CREATE TABLE IF NOT EXISTS voters (
    id TEXT PRIMARY KEY,
    part_no INTEGER NOT NULL,
    assembly_no INTEGER NOT NULL,
    assembly_name_en TEXT,
    assembly_name_mr TEXT,
    parliamentary_no INTEGER,
    parliamentary_name_en TEXT,
    parliamentary_name_mr TEXT,
    polling_station_en TEXT,
    polling_station_mr TEXT,
    section_no INTEGER,
    section_name_en TEXT,
    section_name_mr TEXT,
    serial_no INTEGER NOT NULL,
    epic_no TEXT NOT NULL,
    voter_name_en TEXT NOT NULL,
    voter_name_mr TEXT NOT NULL,
    relation_type_en TEXT,
    relation_type_mr TEXT,
    relative_name_en TEXT,
    relative_name_mr TEXT,
    house_no TEXT,
    address_en TEXT,
    address_mr TEXT,
    age INTEGER NOT NULL,
    gender_en TEXT NOT NULL,
    gender_mr TEXT NOT NULL,
    family_id INTEGER,
    family_role_en TEXT,
    family_role_mr TEXT,
    photo_available BOOLEAN DEFAULT true,
    pdf_page_no INTEGER,
    audit_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for Fast Querying and Search
CREATE INDEX IF NOT EXISTS idx_voters_part_serial ON voters (part_no, serial_no);
CREATE INDEX IF NOT EXISTS idx_voters_epic ON voters (epic_no);
CREATE INDEX IF NOT EXISTS idx_voters_family_id ON voters (part_no, family_id);
CREATE INDEX IF NOT EXISTS idx_voters_age_gender ON voters (age, gender_en);

-- Search Indexes for English & Marathi
CREATE INDEX IF NOT EXISTS idx_voters_name_en ON voters USING gin (to_tsvector('english', voter_name_en));
CREATE INDEX IF NOT EXISTS idx_voters_name_mr ON voters USING gin (to_tsvector('simple', voter_name_mr));
CREATE INDEX IF NOT EXISTS idx_voters_rel_en ON voters USING gin (to_tsvector('english', relative_name_en));
CREATE INDEX IF NOT EXISTS idx_voters_rel_mr ON voters USING gin (to_tsvector('simple', relative_name_mr));

-- 4. Row Level Security (RLS) Configuration
ALTER TABLE booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE voters ENABLE ROW LEVEL SECURITY;

-- Allow public read access for search queries
CREATE POLICY "Allow public read access on booths" ON booths FOR SELECT USING (true);
CREATE POLICY "Allow public read access on sections" ON sections FOR SELECT USING (true);
CREATE POLICY "Allow public read access on voters" ON voters FOR SELECT USING (true);

-- Allow service role and authenticated full access for data migration/seeding
CREATE POLICY "Allow service role write on booths" ON booths FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role write on sections" ON sections FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role write on voters" ON voters FOR ALL TO service_role USING (true) WITH CHECK (true);

