# Configurazione Supabase per LABAlumni

## Credenziali Supabase

- **Project ID**: dqocijtkcafcbqmatvmi
- **Database Password**: Alket.maestro26!
- **Supabase URL**: https://dqocijtkcafcbqmatvmi.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxb2NpanRrY2FmY2JxbWF0dm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDQyMjAsImV4cCI6MjA4MjE4MDIyMH0.HIV_8PsAPKsu50_B36BwCJjDw906QqIs_W3h82DMa_k

## Setup su Railway

1. Vai sul dashboard Railway del tuo progetto
2. Seleziona il servizio LABAlumni
3. Vai alla sezione "Variables"
4. Aggiungi queste variabili d'ambiente:

```
NEXT_PUBLIC_SUPABASE_URL=https://dqocijtkcafcbqmatvmi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxb2NpanRrY2FmY2JxbWF0dm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDQyMjAsImV4cCI6MjA4MjE4MDIyMH0.HIV_8PsAPKsu50_B36BwCJjDw906QqIs_W3h82DMa_k
```

5. Railway riavvierà automaticamente il servizio con Supabase configurato

## Migrazioni Database

Esegui le migrazioni sul SQL Editor di Supabase (https://supabase.com/dashboard/project/dqocijtkcafcbqmatvmi/sql):

1. **001_initial_schema.sql** - Schema iniziale (tabelle, enums, RLS policies)
2. **002_update_courses_and_add_fields.sql** - Aggiornamenti corsi e campi aggiuntivi

Esegui i file nell'ordine indicato.

## Nota sulla Service Role Key

La service role key è più potente e bypassa RLS. **NON** usarla nel frontend - è solo per operazioni server-side o amministrative. Per l'app Next.js usa solo la **anon key**.


