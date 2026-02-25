-- Aggiungi 'admin' all'enum user_role
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e 
    JOIN pg_type t ON e.enumtypid = t.oid 
    WHERE t.typname = 'user_role' AND e.enumlabel = 'admin'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'admin';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Aggiorna handle_new_user per supportare admin (creazione manuale via auth.admin.createUser)
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
  ELSIF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    v_role := 'admin';
  END IF;

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'company_name'
  );

  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (NEW.id, NEW.email, v_role, v_full_name);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: % % (user_id=%, email=%, role=%)',
      SQLERRM, SQLSTATE, NEW.id, NEW.email, v_role;
    RAISE;
END $$;

-- Per creare il primo admin: registrare un utente come Docente (o Azienda), poi:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@tua-email.com';
