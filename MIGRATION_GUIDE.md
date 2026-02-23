# Guida alla Migrazione Database

## Aggiornamento Corsi e Nuovi Campi

Questa guida spiega come aggiornare il database esistente con i nuovi corsi e i nuovi campi.

### Passaggi per la Migrazione

1. **Aggiungi i nuovi campi alla tabella students**

Esegui questo SQL nella console SQL di Supabase:

```sql
-- Aggiungi nuovi campi
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS matricola TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS last_year_update TIMESTAMP WITH TIME ZONE;

-- Aggiungi indice sulla matricola
CREATE INDEX IF NOT EXISTS idx_students_matricola ON public.students(matricola);
```

2. **Aggiorna l'enum course_type**

⚠️ **NOTA**: Cambiare un enum in PostgreSQL è complesso. Esegui questi comandi nell'ordine:

```sql
-- Crea il nuovo enum
CREATE TYPE course_type_new AS ENUM (
  'graphic-design-multimedia',
  'regia-videomaking',
  'fotografia',
  'fashion-design',
  'pittura',
  'design',
  'interior-design',
  'cinema-audiovisivi'
);

-- Aggiungi una colonna temporanea con il nuovo enum
ALTER TABLE public.students 
  ADD COLUMN course_new course_type_new;

-- Migra i dati (mappa i vecchi valori ai nuovi)
UPDATE public.students SET course_new = 
  CASE course::text
    WHEN 'grafica' THEN 'graphic-design-multimedia'::course_type_new
    WHEN 'fotografia' THEN 'fotografia'::course_type_new
    WHEN 'video' THEN 'regia-videomaking'::course_type_new
    WHEN 'fashion-design' THEN 'fashion-design'::course_type_new
    WHEN 'interior-design' THEN 'interior-design'::course_type_new
    WHEN 'web-design' THEN 'design'::course_type_new
    ELSE 'graphic-design-multimedia'::course_type_new  -- default
  END;

-- Rimuovi la colonna vecchia e rinomina quella nuova
ALTER TABLE public.students DROP COLUMN course;
ALTER TABLE public.students RENAME COLUMN course_new TO course;
ALTER TABLE public.students ALTER COLUMN course SET NOT NULL;

-- Aggiorna anche la tabella job_posts (campo courses è un array)
-- Prima devi creare una funzione helper
CREATE OR REPLACE FUNCTION migrate_course_array(old_array text[])
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT 
      CASE unnest(old_array)
        WHEN 'grafica' THEN 'graphic-design-multimedia'
        WHEN 'fotografia' THEN 'fotografia'
        WHEN 'video' THEN 'regia-videomaking'
        WHEN 'fashion-design' THEN 'fashion-design'
        WHEN 'interior-design' THEN 'interior-design'
        WHEN 'web-design' THEN 'design'
        ELSE 'graphic-design-multimedia'
      END
  );
END;
$$ LANGUAGE plpgsql;

-- Aggiorna job_posts (questo è più complesso, potrebbe richiedere un approccio diverso)
-- Se hai dati esistenti in job_posts, aggiornali manualmente o con uno script

-- Rimuovi il vecchio enum (solo se non è più utilizzato)
-- DROP TYPE course_type;

-- Rinomina il nuovo enum
-- ALTER TYPE course_type_new RENAME TO course_type;
```

**Alternativa più semplice per nuove installazioni:**

Se stai partendo da zero o puoi ricreare il database, usa direttamente `001_initial_schema.sql` con i nuovi corsi già aggiornati.

### Verifica della Migrazione

Dopo la migrazione, verifica che:

1. I nuovi campi esistano nella tabella `students`
2. L'enum `course_type` contenga i nuovi valori
3. Gli studenti esistenti abbiano i corsi mappati correttamente
4. Gli annunci di lavoro funzionino correttamente

### Aggiornamento Automatico Anni

Il sistema include una funzione per aggiornare automaticamente gli anni degli studenti ogni 1 ottobre. 

Per abilitare questo, configura un cron job o una funzione programmata che chiami:

```typescript
import { updateStudentYears } from '@/lib/year-updater'
import { supabase } from '@/lib/supabase'

// Esegui il 1 ottobre di ogni anno
await updateStudentYears(supabase)
```

Su Supabase, puoi usare le Edge Functions o un cron job esterno per schedulare questa funzione.



