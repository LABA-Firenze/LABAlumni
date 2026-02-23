-- Esegui questo script nella Supabase Dashboard: SQL Editor → New query → incolla → Run
-- Migration 013-016: docenti, relatore/corelatore, inviti e candidature tesi

-- === 013: Aggiungi 'docente' all'enum e crea tabella docenti ===
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_role' AND e.enumlabel = 'docente') THEN
    ALTER TYPE user_role ADD VALUE 'docente';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.docenti (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT,
  courses course_type[] DEFAULT '{}',
  can_relatore BOOLEAN DEFAULT true,
  can_corelatore BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.thesis_proposals
  ADD COLUMN IF NOT EXISTS relatore_id UUID REFERENCES public.docenti(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS corelatore_id UUID REFERENCES public.docenti(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_thesis_proposals_relatore ON public.thesis_proposals(relatore_id);
CREATE INDEX IF NOT EXISTS idx_thesis_proposals_corelatore ON public.thesis_proposals(corelatore_id);
CREATE INDEX IF NOT EXISTS idx_docenti_id ON public.docenti(id);

ALTER TABLE public.docenti ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view docenti" ON public.docenti;
CREATE POLICY "Anyone can view docenti" ON public.docenti FOR SELECT USING (true);

DROP POLICY IF EXISTS "Docenti can insert own profile" ON public.docenti;
CREATE POLICY "Docenti can insert own profile" ON public.docenti FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Docenti can update own profile" ON public.docenti;
CREATE POLICY "Docenti can update own profile" ON public.docenti FOR UPDATE USING (auth.uid() = id);

-- === 014: handle_new_user robusta (supporta docente) ===
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role := 'student';
  v_full_name TEXT;
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'company' THEN
    v_role := 'company';
  ELSIF NEW.raw_user_meta_data->>'role' = 'docente' THEN
    v_role := 'docente';
  END IF;
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'company_name');
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (NEW.id, NEW.email, v_role, v_full_name);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: % % (user_id=%, email=%, role=%)', SQLERRM, SQLSTATE, NEW.id, NEW.email, v_role;
    RAISE;
END $$;

-- === 015: Tabelle inviti e candidature tesi ===
CREATE TABLE IF NOT EXISTS public.thesis_relatore_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thesis_id UUID NOT NULL REFERENCES public.thesis_proposals(id) ON DELETE CASCADE,
  docente_id UUID NOT NULL REFERENCES public.docenti(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thesis_id)
);

CREATE TABLE IF NOT EXISTS public.thesis_relatore_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thesis_id UUID NOT NULL REFERENCES public.thesis_proposals(id) ON DELETE CASCADE,
  docente_id UUID NOT NULL REFERENCES public.docenti(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thesis_id, docente_id)
);

CREATE TABLE IF NOT EXISTS public.thesis_corelatore_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thesis_id UUID NOT NULL REFERENCES public.thesis_proposals(id) ON DELETE CASCADE,
  docente_id UUID NOT NULL REFERENCES public.docenti(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thesis_id)
);

CREATE TABLE IF NOT EXISTS public.thesis_corelatore_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thesis_id UUID NOT NULL REFERENCES public.thesis_proposals(id) ON DELETE CASCADE,
  docente_id UUID NOT NULL REFERENCES public.docenti(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thesis_id, docente_id)
);

CREATE INDEX IF NOT EXISTS idx_thesis_relatore_inv_thesis ON thesis_relatore_invitations(thesis_id);
CREATE INDEX IF NOT EXISTS idx_thesis_relatore_inv_docente ON thesis_relatore_invitations(docente_id);
CREATE INDEX IF NOT EXISTS idx_thesis_relatore_app_thesis ON thesis_relatore_applications(thesis_id);
CREATE INDEX IF NOT EXISTS idx_thesis_relatore_app_docente ON thesis_relatore_applications(docente_id);
CREATE INDEX IF NOT EXISTS idx_thesis_corelatore_inv_thesis ON thesis_corelatore_invitations(thesis_id);
CREATE INDEX IF NOT EXISTS idx_thesis_corelatore_inv_docente ON thesis_corelatore_invitations(docente_id);
CREATE INDEX IF NOT EXISTS idx_thesis_corelatore_app_thesis ON thesis_corelatore_applications(thesis_id);
CREATE INDEX IF NOT EXISTS idx_thesis_corelatore_app_docente ON thesis_corelatore_applications(docente_id);

ALTER TABLE public.thesis_relatore_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_relatore_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_corelatore_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_corelatore_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view relatore invitations" ON thesis_relatore_invitations;
CREATE POLICY "Anyone can view relatore invitations" ON thesis_relatore_invitations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view relatore applications" ON thesis_relatore_applications;
CREATE POLICY "Anyone can view relatore applications" ON thesis_relatore_applications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view corelatore invitations" ON thesis_corelatore_invitations;
CREATE POLICY "Anyone can view corelatore invitations" ON thesis_corelatore_invitations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view corelatore applications" ON thesis_corelatore_applications;
CREATE POLICY "Anyone can view corelatore applications" ON thesis_corelatore_applications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Students create relatore invitations" ON thesis_relatore_invitations;
CREATE POLICY "Students create relatore invitations" ON thesis_relatore_invitations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM thesis_proposals tp WHERE tp.id = thesis_id AND tp.student_id = auth.uid()));
DROP POLICY IF EXISTS "Docenti create relatore applications" ON thesis_relatore_applications;
CREATE POLICY "Docenti create relatore applications" ON thesis_relatore_applications FOR INSERT
  WITH CHECK (auth.uid() = docente_id AND EXISTS (SELECT 1 FROM docenti d WHERE d.id = auth.uid()));
DROP POLICY IF EXISTS "Docenti update own invitations" ON thesis_relatore_invitations;
CREATE POLICY "Docenti update own invitations" ON thesis_relatore_invitations FOR UPDATE USING (docente_id = auth.uid());
DROP POLICY IF EXISTS "Students update applications for own thesis" ON thesis_relatore_applications;
CREATE POLICY "Students update applications for own thesis" ON thesis_relatore_applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM thesis_proposals tp WHERE tp.id = thesis_id AND tp.student_id = auth.uid()));
DROP POLICY IF EXISTS "Students create corelatore invitations" ON thesis_corelatore_invitations;
CREATE POLICY "Students create corelatore invitations" ON thesis_corelatore_invitations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM thesis_proposals tp WHERE tp.id = thesis_id AND tp.student_id = auth.uid()));
DROP POLICY IF EXISTS "Docenti create corelatore applications" ON thesis_corelatore_applications;
CREATE POLICY "Docenti create corelatore applications" ON thesis_corelatore_applications FOR INSERT
  WITH CHECK (auth.uid() = docente_id AND EXISTS (SELECT 1 FROM docenti d WHERE d.id = auth.uid()));
DROP POLICY IF EXISTS "Docenti update own corelatore invitations" ON thesis_corelatore_invitations;
CREATE POLICY "Docenti update own corelatore invitations" ON thesis_corelatore_invitations FOR UPDATE USING (docente_id = auth.uid());
DROP POLICY IF EXISTS "Students update corelatore applications" ON thesis_corelatore_applications;
CREATE POLICY "Students update corelatore applications" ON thesis_corelatore_applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM thesis_proposals tp WHERE tp.id = thesis_id AND tp.student_id = auth.uid()));

-- === 016: Trigger per aggiornare thesis_proposals quando docente accetta invito ===
CREATE OR REPLACE FUNCTION public.thesis_on_relatore_invitation_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    UPDATE public.thesis_proposals SET relatore_id = NEW.docente_id, updated_at = NOW() WHERE id = NEW.thesis_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.thesis_on_corelatore_invitation_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    UPDATE public.thesis_proposals SET corelatore_id = NEW.docente_id, updated_at = NOW() WHERE id = NEW.thesis_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_thesis_relatore_invitation_accepted ON public.thesis_relatore_invitations;
CREATE TRIGGER trg_thesis_relatore_invitation_accepted
  AFTER UPDATE OF status ON public.thesis_relatore_invitations
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.thesis_on_relatore_invitation_accepted();

DROP TRIGGER IF EXISTS trg_thesis_corelatore_invitation_accepted ON public.thesis_corelatore_invitations;
CREATE TRIGGER trg_thesis_corelatore_invitation_accepted
  AFTER UPDATE OF status ON public.thesis_corelatore_invitations
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.thesis_on_corelatore_invitation_accepted();
