-- Etichetta display per membri staff (Matteo Coppola, Alessia Pasqui, Simone Azzinelli)
-- Quando valorizzata, viene mostrata al posto di corso/anno da LOGOS
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS display_label TEXT;

-- Permette course NULL per utenti staff (hanno solo display_label)
ALTER TABLE public.students
  ALTER COLUMN course DROP NOT NULL;
