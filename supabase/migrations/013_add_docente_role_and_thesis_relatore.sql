-- Ruolo Docente: può fare da Relatore o Corelatore per le tesi
-- Studente propone tesi selezionando docente dalla lista
-- Relatore obbligatorio, Corelatore opzionale (max 1 relatore + 1 corelatore)

-- Aggiungi 'docente' all'enum user_role
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_role' AND e.enumlabel = 'docente') THEN
    ALTER TYPE user_role ADD VALUE 'docente';
  END IF;
END $$;

-- Tabella docenti (come students/companies)
CREATE TABLE IF NOT EXISTS public.docenti (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT,
  courses course_type[] DEFAULT '{}',  -- corsi di competenza
  can_relatore BOOLEAN DEFAULT true,
  can_corelatore BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relatore e Corelatore sulle thesis_proposals
ALTER TABLE public.thesis_proposals
  ADD COLUMN IF NOT EXISTS relatore_id UUID REFERENCES public.docenti(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS corelatore_id UUID REFERENCES public.docenti(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_thesis_proposals_relatore ON public.thesis_proposals(relatore_id);
CREATE INDEX IF NOT EXISTS idx_thesis_proposals_corelatore ON public.thesis_proposals(corelatore_id);
CREATE INDEX IF NOT EXISTS idx_docenti_id ON public.docenti(id);

-- RLS per docenti
ALTER TABLE public.docenti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view docenti"
  ON public.docenti FOR SELECT
  USING (true);

CREATE POLICY "Docenti can insert own profile"
  ON public.docenti FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Docenti can update own profile"
  ON public.docenti FOR UPDATE
  USING (auth.uid() = id);

-- Aggiorna handle_new_user per supportare docente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role user_role := 'student';
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'company' THEN
    user_role := 'company';
  ELSIF NEW.raw_user_meta_data->>'role' = 'docente' THEN
    user_role := 'docente';
  END IF;
  
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'company_name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
