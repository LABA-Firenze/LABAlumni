-- Fix "Database error saving new user" per registrazione docente e azienda
-- 1. Assicura che 'docente' sia nell'enum user_role
-- 2. Aggiorna handle_new_user con gestione errori robusta

-- Aggiungi 'docente' all'enum se non presente
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e 
    JOIN pg_type t ON e.enumtypid = t.oid 
    WHERE t.typname = 'user_role' AND e.enumlabel = 'docente'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'docente';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;  -- già presente
END $$;

-- Sostituisci handle_new_user con versione robusta
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
  -- Determina il ruolo da metadata
  IF NEW.raw_user_meta_data->>'role' = 'company' THEN
    v_role := 'company';
  ELSIF NEW.raw_user_meta_data->>'role' = 'docente' THEN
    v_role := 'docente';
  END IF;

  -- Nome: preferisci full_name, altrimenti company_name
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'company_name'
  );

  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (NEW.id, NEW.email, v_role, v_full_name);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log in Postgres per debugging (visibile in Supabase Logs)
    RAISE WARNING 'handle_new_user failed: % % (user_id=%, email=%, role=%)',
      SQLERRM, SQLSTATE, NEW.id, NEW.email, v_role;
    RAISE;
END $$;
