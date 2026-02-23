-- Create a SECURITY DEFINER function to insert student records
-- This bypasses RLS and ensures the insert works during registration

CREATE OR REPLACE FUNCTION public.insert_student_profile(
  p_id UUID,
  p_course course_type,
  p_year INTEGER,
  p_phone TEXT,
  p_matricola TEXT,
  p_bio TEXT DEFAULT NULL,
  p_portfolio_url TEXT DEFAULT NULL,
  p_twitter_url TEXT DEFAULT NULL,
  p_linkedin_url TEXT DEFAULT NULL,
  p_website_url TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.students (
    id,
    course,
    year,
    phone,
    matricola,
    bio,
    portfolio_url,
    twitter_url,
    linkedin_url,
    website_url,
    last_year_update,
    created_at,
    updated_at
  )
  VALUES (
    p_id,
    p_course,
    p_year,
    p_phone,
    p_matricola,
    p_bio,
    p_portfolio_url,
    p_twitter_url,
    p_linkedin_url,
    p_website_url,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_student_profile TO authenticated;

-- Still ensure the INSERT policy exists (in case function approach doesn't work)
DROP POLICY IF EXISTS "Students can insert own profile" ON public.students;
CREATE POLICY "Students can insert own profile"
  ON public.students FOR INSERT
  WITH CHECK (auth.uid() = id);


