-- Social Network Tables for LABAlumni
-- Feed, Posts, Connections, Portfolio, Thesis Proposals

-- Posts table (Feed Social)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video', 'job', 'portfolio', 'thesis')),
  content TEXT NOT NULL,
  images TEXT[], -- Array of image URLs
  video_url TEXT,
  job_post_id UUID REFERENCES public.job_posts(id) ON DELETE SET NULL,
  portfolio_item_id UUID, -- Will reference portfolio_items when created
  thesis_proposal_id UUID, -- Will reference thesis_proposals when created
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Post comments
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student connections (Network)
CREATE TABLE IF NOT EXISTS public.student_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student1_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student2_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student1_id, student2_id),
  CHECK (student1_id != student2_id)
);

-- Portfolio items
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  images TEXT[] NOT NULL,
  video_url TEXT,
  category TEXT, -- 'grafica', 'foto', 'video', 'design', etc.
  tags TEXT[],
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thesis proposals
CREATE TABLE IF NOT EXISTS public.thesis_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  objectives TEXT,
  methodology TEXT,
  documents TEXT[], -- Array of document URLs
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company follows (Students following companies)
CREATE TABLE IF NOT EXISTS public.company_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, company_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(type);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_student_connections_student1 ON public.student_connections(student1_id);
CREATE INDEX IF NOT EXISTS idx_student_connections_student2 ON public.student_connections(student2_id);
CREATE INDEX IF NOT EXISTS idx_student_connections_status ON public.student_connections(status);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_student_id ON public.portfolio_items(student_id);
CREATE INDEX IF NOT EXISTS idx_thesis_proposals_student_id ON public.thesis_proposals(student_id);
CREATE INDEX IF NOT EXISTS idx_company_follows_student_id ON public.company_follows(student_id);
CREATE INDEX IF NOT EXISTS idx_company_follows_company_id ON public.company_follows(company_id);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Users can view all posts"
  ON public.posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for post_likes
CREATE POLICY "Users can view all likes"
  ON public.post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for post_comments
CREATE POLICY "Users can view all comments"
  ON public.post_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.post_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for student_connections
CREATE POLICY "Users can view own connections"
  ON public.student_connections FOR SELECT
  USING (
    student1_id = (SELECT id FROM public.students WHERE id = auth.uid())
    OR student2_id = (SELECT id FROM public.students WHERE id = auth.uid())
  );

CREATE POLICY "Students can create connection requests"
  ON public.student_connections FOR INSERT
  WITH CHECK (
    student1_id = (SELECT id FROM public.students WHERE id = auth.uid())
  );

CREATE POLICY "Students can update connection status"
  ON public.student_connections FOR UPDATE
  USING (
    student2_id = (SELECT id FROM public.students WHERE id = auth.uid())
  );

-- RLS Policies for portfolio_items
CREATE POLICY "Users can view all portfolio items"
  ON public.portfolio_items FOR SELECT
  USING (true);

CREATE POLICY "Students can create portfolio items"
  ON public.portfolio_items FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own portfolio items"
  ON public.portfolio_items FOR UPDATE
  USING (student_id = auth.uid());

CREATE POLICY "Students can delete own portfolio items"
  ON public.portfolio_items FOR DELETE
  USING (student_id = auth.uid());

-- RLS Policies for thesis_proposals
CREATE POLICY "Users can view all thesis proposals"
  ON public.thesis_proposals FOR SELECT
  USING (true);

CREATE POLICY "Students can create thesis proposals"
  ON public.thesis_proposals FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own thesis proposals"
  ON public.thesis_proposals FOR UPDATE
  USING (student_id = auth.uid());

-- RLS Policies for company_follows
CREATE POLICY "Users can view all follows"
  ON public.company_follows FOR SELECT
  USING (true);

CREATE POLICY "Students can follow companies"
  ON public.company_follows FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can unfollow companies"
  ON public.company_follows FOR DELETE
  USING (student_id = auth.uid());

-- Function to update post counts
CREATE OR REPLACE FUNCTION public.update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'post_likes' THEN
      UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'post_likes' THEN
      UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating post counts
CREATE TRIGGER update_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_counts();

CREATE TRIGGER update_post_comments_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_counts();

-- Triggers for updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_student_connections_updated_at
  BEFORE UPDATE ON public.student_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_portfolio_items_updated_at
  BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_thesis_proposals_updated_at
  BEFORE UPDATE ON public.thesis_proposals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


