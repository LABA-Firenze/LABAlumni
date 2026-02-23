-- Campi aggiuntivi per registrazione aziende
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS partita_iva TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS cap TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Italia';

-- Policy per consentire alle aziende di inserire il proprio record alla registrazione
CREATE POLICY "Companies can insert own profile on registration"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Aggiorna handle_new_user per supportare role da metadata (company vs student)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role user_role := 'student';
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'company' THEN
    user_role := 'company';
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
