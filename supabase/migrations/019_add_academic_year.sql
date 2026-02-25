-- Anno accademico (es. A.A. 24/25) da LOGOS pianoStudi
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS academic_year TEXT;
