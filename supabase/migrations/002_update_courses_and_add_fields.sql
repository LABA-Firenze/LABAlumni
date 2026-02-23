-- Update course_type enum (drop and recreate with new values)
-- Note: In production, you might need to migrate data first

-- First, drop dependent constraints
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_course_fkey;

-- Drop the old enum type (this will fail if there are dependencies, so we comment it out)
-- DROP TYPE IF EXISTS course_type CASCADE;

-- Create new enum type with correct courses
DO $$ BEGIN
    CREATE TYPE course_type_new AS ENUM (
      'graphic-design-multimedia',
      'regia-videomaking',
      'fotografia',
      'fashion-design',
      'pittura',
      'design',
      'interior-design',
      'cinema-audiovisivi'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to students table
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS matricola TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS last_year_update TIMESTAMP WITH TIME ZONE;

-- Update existing records if needed (optional, for migration)
-- This is a placeholder for data migration if needed

-- Add index on matricola for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_matricola ON public.students(matricola);



