-- LABAlumni: Preferiti, Notifiche, Eventi, Storie, Badge, Scadenza annunci, Impostazioni
-- PREREQUISITO: eseguire prima 024_extend_user_role_enum.sql (transazione separata)

-- 1. Saved jobs (preferiti annunci)
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  job_post_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, job_post_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_student ON public.saved_jobs(student_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON public.saved_jobs(job_post_id);
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own saved jobs" ON public.saved_jobs FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can save jobs" ON public.saved_jobs FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can unsave jobs" ON public.saved_jobs FOR DELETE USING (student_id = auth.uid());

-- 2. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'message', 'application', 'connection', 'comment', 'job_saved_alert', etc.
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications (read)" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
-- Notifiche: insert da API/triggers con service role (client non crea notifiche)
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- 3. Job deadline
ALTER TABLE public.job_posts ADD COLUMN IF NOT EXISTS deadline DATE;

-- 4. Application viewed_at (optional - quando l'azienda ha letto la candidatura)
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE;

-- 5. Events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE,
  location TEXT,
  max_participants INTEGER,
  image_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_start ON public.events(start_at);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published events" ON public.events FOR SELECT USING (published = true OR created_by = auth.uid());
CREATE POLICY "Admins/creators can manage events" ON public.events FOR ALL USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. Event registrations
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON public.event_registrations(event_id);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own registrations" ON public.event_registrations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can register for events" ON public.event_registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unregister" ON public.event_registrations FOR DELETE USING (user_id = auth.uid());

-- 7. Success stories
CREATE TABLE IF NOT EXISTS public.success_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT,
  author_course TEXT,
  image_url TEXT,
  company_name TEXT,
  published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published stories" ON public.success_stories FOR SELECT USING (published = true);
CREATE POLICY "Admins can manage stories" ON public.success_stories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8. User badges/achievements
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view others badges" ON public.user_badges FOR SELECT USING (true);

-- 9. User preferences (impostazioni)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  notify_messages BOOLEAN DEFAULT true,
  notify_applications BOOLEAN DEFAULT true,
  notify_connections BOOLEAN DEFAULT true,
  notify_comments BOOLEAN DEFAULT true,
  profile_visibility TEXT DEFAULT 'all' CHECK (profile_visibility IN ('all', 'connections', 'students')),
  show_email BOOLEAN DEFAULT false,
  tour_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (user_id = auth.uid());
