-- Quando un docente accetta un invito (relatore o corelatore),
-- aggiorna automaticamente thesis_proposals per evitare che il docente
-- debba avere permessi di UPDATE sulla tabella (solo lo studente può aggiornarla via RLS).

CREATE OR REPLACE FUNCTION public.thesis_on_relatore_invitation_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    UPDATE public.thesis_proposals
    SET relatore_id = NEW.docente_id, updated_at = NOW()
    WHERE id = NEW.thesis_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.thesis_on_corelatore_invitation_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    UPDATE public.thesis_proposals
    SET corelatore_id = NEW.docente_id, updated_at = NOW()
    WHERE id = NEW.thesis_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_thesis_relatore_invitation_accepted ON public.thesis_relatore_invitations;
CREATE TRIGGER trg_thesis_relatore_invitation_accepted
  AFTER UPDATE OF status ON public.thesis_relatore_invitations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.thesis_on_relatore_invitation_accepted();

DROP TRIGGER IF EXISTS trg_thesis_corelatore_invitation_accepted ON public.thesis_corelatore_invitations;
CREATE TRIGGER trg_thesis_corelatore_invitation_accepted
  AFTER UPDATE OF status ON public.thesis_corelatore_invitations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.thesis_on_corelatore_invitation_accepted();
