-- Collaboration request: distingue studente vs azienda con campi specifici
-- Studente: corso implicito dal profilo, giorni/ore/note, allegato portfolio (max 1), max 1 post/settimana
-- Azienda: corsi target, descrizione, ore tirocinio, giorni, nessun limite

-- Campo per distinguere chi fa la richiesta
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS request_from TEXT CHECK (request_from IN ('student', 'company'));

-- Campi per STUDENTE: giorni disponibili, ore totali, note (content già usato per descrizione)
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS available_days TEXT,
  ADD COLUMN IF NOT EXISTS available_hours_total INTEGER,
  ADD COLUMN IF NOT EXISTS portfolio_item_id UUID REFERENCES public.portfolio_items(id) ON DELETE SET NULL;

-- Campi per AZIENDA: ore lavorative tirocinio, giorni interessati (request_courses già esiste)
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS work_hours INTEGER,
  ADD COLUMN IF NOT EXISTS interested_days TEXT;

-- Aggiorna RLS: anche le aziende possono creare collaboration_request
DROP POLICY IF EXISTS "Companies can create posts" ON public.posts;

CREATE POLICY "Companies can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'company'
    )
  );
