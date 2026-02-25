-- Ensure students can delete their own thesis proposals (idempotent: drop + create)
DROP POLICY IF EXISTS "Students can delete own thesis proposals" ON public.thesis_proposals;
CREATE POLICY "Students can delete own thesis proposals"
  ON public.thesis_proposals FOR DELETE
  USING (student_id = auth.uid());
