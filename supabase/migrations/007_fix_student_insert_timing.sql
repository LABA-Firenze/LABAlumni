-- Fix student insert timing issue
-- Ensure profile exists before inserting student record

-- Update the insert_student_profile function to check if profile exists first
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
  -- Ensure profile exists (should be created by trigger, but check anyway)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_id) THEN
    -- Create profile if it doesn't exist
    INSERT INTO public.profiles (id, email, role, created_at, updated_at)
    SELECT id, email, 'student'::user_role, NOW(), NOW()
    FROM auth.users
    WHERE id = p_id
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Now insert student record
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
  ON CONFLICT (id) DO UPDATE SET
    course = EXCLUDED.course,
    year = EXCLUDED.year,
    phone = EXCLUDED.phone,
    matricola = EXCLUDED.matricola,
    bio = EXCLUDED.bio,
    portfolio_url = EXCLUDED.portfolio_url,
    twitter_url = EXCLUDED.twitter_url,
    linkedin_url = EXCLUDED.linkedin_url,
    website_url = EXCLUDED.website_url,
    updated_at = NOW();
END;
$$;


