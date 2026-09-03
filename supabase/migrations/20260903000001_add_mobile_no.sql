-- Supabase Migration: Add mobile_no to voters table
ALTER TABLE voters ADD COLUMN IF NOT EXISTS mobile_no TEXT;
CREATE INDEX IF NOT EXISTS idx_voters_mobile ON voters (mobile_no);
