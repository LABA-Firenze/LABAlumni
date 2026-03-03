-- Estendi user_role con docente e admin (transazione separata - necessaria prima di 025)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_role' AND e.enumlabel = 'docente') THEN
    ALTER TYPE user_role ADD VALUE 'docente';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_role' AND e.enumlabel = 'admin') THEN
    ALTER TYPE user_role ADD VALUE 'admin';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
