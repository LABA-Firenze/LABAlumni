-- Add INSERT policy for students table
-- This allows authenticated users to create their own student profile during registration

CREATE POLICY "Students can insert own profile"
  ON public.students FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Also add INSERT policy for profiles if missing (should be handled by trigger, but just in case)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


