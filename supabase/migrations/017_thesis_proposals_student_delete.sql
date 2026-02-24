-- Allow students to delete their own thesis proposals (to create a new one)
CREATE POLICY "Students can delete own thesis proposals"
  ON public.thesis_proposals FOR DELETE
  USING (student_id = auth.uid());

-- Enforce max one active proposal per student (open or in_progress)
CREATE UNIQUE INDEX IF NOT EXISTS idx_thesis_proposals_one_active_per_student
  ON public.thesis_proposals (student_id)
  WHERE status IN ('open', 'in_progress');
