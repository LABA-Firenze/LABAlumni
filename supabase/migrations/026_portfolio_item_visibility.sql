-- Visibilità singolo item portfolio: segue profilo, pubblico, o privato
ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'profile'
  CHECK (visibility IN ('profile', 'public', 'private'));

COMMENT ON COLUMN public.portfolio_items.visibility IS 'profile = segue impostazioni profilo; public = visibile a tutti; private = solo proprietario';
