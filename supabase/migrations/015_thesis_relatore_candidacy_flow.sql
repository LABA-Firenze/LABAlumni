-- Flusso tesi: studente può pubblicare con o senza relatore
-- Se CON relatore: invito al relatore che accetta/rifiuta
-- Se SENZA relatore: docente può candidarsi "Mi interessa", studente riceve e accetta

-- Inviti relatore (studente ha selezionato relatore in fase di creazione)
CREATE TABLE IF NOT EXISTS public.thesis_relatore_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thesis_id UUID NOT NULL REFERENCES public.thesis_proposals(id) ON DELETE CASCADE,
  docente_id UUID NOT NULL REFERENCES public.docenti(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thesis_id)
);

-- Candidature relatore (docente si candida per tesi senza relatore)
CREATE TABLE IF NOT EXISTS public.thesis_relatore_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thesis_id UUID NOT NULL REFERENCES public.thesis_proposals(id) ON DELETE CASCADE,
  docente_id UUID NOT NULL REFERENCES public.docenti(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thesis_id, docente_id)
);

-- Inviti corelatore
CREATE TABLE IF NOT EXISTS public.thesis_corelatore_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thesis_id UUID NOT NULL REFERENCES public.thesis_proposals(id) ON DELETE CASCADE,
  docente_id UUID NOT NULL REFERENCES public.docenti(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thesis_id)
);

-- Candidature corelatore
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

-- RLS: tutti possono leggere (per mostrare stato)
CREATE POLICY "Anyone can view relatore invitations" ON thesis_relatore_invitations FOR SELECT USING (true);
CREATE POLICY "Anyone can view relatore applications" ON thesis_relatore_applications FOR SELECT USING (true);
CREATE POLICY "Anyone can view corelatore invitations" ON thesis_corelatore_invitations FOR SELECT USING (true);
CREATE POLICY "Anyone can view corelatore applications" ON thesis_corelatore_applications FOR SELECT USING (true);

-- Studenti creano inviti (quando pubblicano tesi con relatore selezionato)
CREATE POLICY "Students create relatore invitations" ON thesis_relatore_invitations FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM thesis_proposals tp WHERE tp.id = thesis_id AND tp.student_id = auth.uid())
  );

-- Docenti inseriscono candidature (applicano)
CREATE POLICY "Docenti create relatore applications" ON thesis_relatore_applications FOR INSERT
  WITH CHECK (
    auth.uid() = docente_id AND
    EXISTS (SELECT 1 FROM docenti d WHERE d.id = auth.uid())
  );

-- Docente accetta/rifiuta invito
CREATE POLICY "Docenti update own invitations" ON thesis_relatore_invitations FOR UPDATE
  USING (docente_id = auth.uid());

-- Studente accetta/rifiuta candidatura docente
CREATE POLICY "Students update applications for own thesis" ON thesis_relatore_applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM thesis_proposals tp WHERE tp.id = thesis_id AND tp.student_id = auth.uid())
  );

-- Stesse policy per corelatore
CREATE POLICY "Students create corelatore invitations" ON thesis_corelatore_invitations FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM thesis_proposals tp WHERE tp.id = thesis_id AND tp.student_id = auth.uid())
  );
CREATE POLICY "Docenti create corelatore applications" ON thesis_corelatore_applications FOR INSERT
  WITH CHECK (auth.uid() = docente_id AND EXISTS (SELECT 1 FROM docenti d WHERE d.id = auth.uid()));
CREATE POLICY "Docenti update own corelatore invitations" ON thesis_corelatore_invitations FOR UPDATE USING (docente_id = auth.uid());
CREATE POLICY "Students update corelatore applications" ON thesis_corelatore_applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM thesis_proposals tp WHERE tp.id = thesis_id AND tp.student_id = auth.uid()));
