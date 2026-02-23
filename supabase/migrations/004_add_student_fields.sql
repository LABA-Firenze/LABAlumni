-- Add missing fields to students table (extracted from 002)
-- These fields are needed for student registration

-- Add new columns to students table
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS matricola TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS last_year_update TIMESTAMP WITH TIME ZONE;

-- Add index on matricola for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_matricola ON public.students(matricola);


