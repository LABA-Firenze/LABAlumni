-- Add onboarding_completed to students for first-login tutorial
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.students.onboarding_completed IS 'True when student has completed the first-login onboarding tutorial';
