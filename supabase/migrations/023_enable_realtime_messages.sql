-- Abilita Supabase Realtime per la tabella messages (messaggistica)
-- Permette ai client di ricevere INSERT e UPDATE in tempo reale
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
