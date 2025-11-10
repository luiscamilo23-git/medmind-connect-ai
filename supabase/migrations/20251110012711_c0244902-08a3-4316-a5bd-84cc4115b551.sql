-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create RLS policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create posts table for social network
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  post_type TEXT NOT NULL DEFAULT 'educational' CHECK (post_type IN ('educational', 'case_study', 'tip', 'announcement')),
  tags TEXT[],
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for posts
CREATE POLICY "Anyone can view published posts"
ON public.posts FOR SELECT
USING (published = true);

CREATE POLICY "Doctors can insert their own posts"
ON public.posts FOR INSERT
WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own posts"
ON public.posts FOR UPDATE
USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own posts"
ON public.posts FOR DELETE
USING (auth.uid() = doctor_id);

-- Create post_likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS on post_likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_likes
CREATE POLICY "Anyone can view likes"
ON public.post_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like posts"
ON public.post_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
ON public.post_likes FOR DELETE
USING (auth.uid() = user_id);

-- Create post_comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on post_comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_comments
CREATE POLICY "Anyone can view comments"
ON public.post_comments FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own comments"
ON public.post_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.post_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.post_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET likes_count = likes_count - 1
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for likes count
CREATE TRIGGER update_likes_count_trigger
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_likes_count();

-- Create function to update comments count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comments_count = comments_count - 1
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for comments count
CREATE TRIGGER update_comments_count_trigger
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_post_comments_count();

-- Add trigger to update updated_at on posts
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to update updated_at on post_comments
CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();