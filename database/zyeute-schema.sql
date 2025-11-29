-- ============================================
-- ZYEUTÉ - Réseau Social Québécois
-- Schema pour fonctionnalités sociales (TikTok + Instagram)
-- ============================================

-- ============================================
-- Extension de la table Users pour profils sociaux
-- ============================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT, -- Ville, Québec
  ADD COLUMN IF NOT EXISTS region TEXT CHECK (region IN ('Montréal', 'Québec', 'Gatineau', 'Sherbrooke', 'Trois-Rivières', 'Saguenay', 'Lévis', 'Laval', 'Autre')),
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS posts_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'fr' CHECK (language IN ('fr', 'en'));

-- Index pour recherche de username
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_region ON public.users(region) WHERE region IS NOT NULL;

-- ============================================
-- Table Posts (Publications - Photos & Vidéos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video', 'carousel')),
  caption TEXT,
  media_urls TEXT[] NOT NULL, -- Array d'URLs pour médias
  thumbnail_url TEXT, -- Pour vidéos
  duration INTEGER, -- Durée vidéo en secondes
  width INTEGER,
  height INTEGER,
  location TEXT, -- Lieu de prise de vue
  region TEXT CHECK (region IN ('Montréal', 'Québec', 'Gatineau', 'Sherbrooke', 'Trois-Rivières', 'Saguenay', 'Lévis', 'Laval', 'Autre')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  allow_comments BOOLEAN DEFAULT TRUE,
  hashtags TEXT[], -- Array de hashtags
  mentions TEXT[], -- Array de @usernames mentionnés
  music_track TEXT, -- Piste audio (style TikTok)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_region ON public.posts(region) WHERE region IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON public.posts USING GIN(hashtags);

-- ============================================
-- Table Likes (J'aime)
-- ============================================
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id) -- Un utilisateur ne peut liker qu'une fois
);

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at DESC);

-- ============================================
-- Table Comments (Commentaires)
-- ============================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- Pour réponses
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- ============================================
-- Table Comment Likes
-- ============================================
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);

-- ============================================
-- Table Follows (Relations Abonnés/Abonnements)
-- ============================================
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Qui suit
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Qui est suivi
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- On ne peut pas se suivre soi-même
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at DESC);

-- ============================================
-- Table Stories (Histoires éphémères - 24h)
-- ============================================
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- Durée vidéo en secondes
  views_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);

-- ============================================
-- Table Story Views
-- ============================================
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON public.story_views(viewer_id);

-- ============================================
-- Table Hashtags (Tendances)
-- ============================================
CREATE TABLE IF NOT EXISTS public.hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT UNIQUE NOT NULL,
  posts_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON public.hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_posts_count ON public.hashtags(posts_count DESC);

-- ============================================
-- Table Notifications
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Qui a fait l'action
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention', 'story_view')),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = FALSE;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts publics visibles par tous"
  ON public.posts FOR SELECT
  USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent créer leurs posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent modifier leurs posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent supprimer leurs posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- Likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes visibles par tous"
  ON public.likes FOR SELECT
  USING (TRUE);

CREATE POLICY "Utilisateurs peuvent créer leurs likes"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent supprimer leurs likes"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commentaires visibles par tous"
  ON public.comments FOR SELECT
  USING (TRUE);

CREATE POLICY "Utilisateurs peuvent créer commentaires"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent modifier leurs commentaires"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent supprimer leurs commentaires"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- Follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Relations follows visibles par tous"
  ON public.follows FOR SELECT
  USING (TRUE);

CREATE POLICY "Utilisateurs peuvent créer follows"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Utilisateurs peuvent supprimer leurs follows"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories non expirées visibles par tous"
  ON public.stories FOR SELECT
  USING (expires_at > NOW());

CREATE POLICY "Utilisateurs peuvent créer leurs stories"
  ON public.stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent supprimer leurs stories"
  ON public.stories FOR DELETE
  USING (auth.uid() = user_id);

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs voient leurs notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent mettre à jour leurs notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Functions et Triggers
-- ============================================

-- Trigger pour mettre à jour updated_at sur posts
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour updated_at sur comments
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function pour incrémenter likes_count sur posts
CREATE OR REPLACE FUNCTION increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_liked
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_post_likes();

-- Function pour décrémenter likes_count sur posts
CREATE OR REPLACE FUNCTION decrement_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = likes_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_unliked
  AFTER DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_post_likes();

-- Function pour incrémenter comments_count
CREATE OR REPLACE FUNCTION increment_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_added
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION increment_post_comments();

-- Function pour décrémenter comments_count
CREATE OR REPLACE FUNCTION decrement_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET comments_count = comments_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_deleted
  AFTER DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION decrement_post_comments();

-- Function pour mettre à jour followers_count et following_count
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrémenter following_count pour le follower
    UPDATE public.users
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;

    -- Incrémenter followers_count pour le following
    UPDATE public.users
    SET followers_count = followers_count + 1
    WHERE id = NEW.following_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Décrémenter following_count pour le follower
    UPDATE public.users
    SET following_count = following_count - 1
    WHERE id = OLD.follower_id;

    -- Décrémenter followers_count pour le following
    UPDATE public.users
    SET followers_count = followers_count - 1
    WHERE id = OLD.following_id;

    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follow_counts_trigger
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

-- Function pour incrémenter posts_count
CREATE OR REPLACE FUNCTION increment_user_posts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET posts_count = posts_count + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_post_added
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION increment_user_posts();

-- Function pour décrémenter posts_count
CREATE OR REPLACE FUNCTION decrement_user_posts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET posts_count = posts_count - 1
  WHERE id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_post_deleted
  AFTER DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION decrement_user_posts();

-- Function pour créer notification sur like
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Récupérer l'ID du propriétaire du post
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;

  -- Ne pas notifier si on like son propre post
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id)
    VALUES (post_owner_id, NEW.user_id, 'like', NEW.post_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER like_notification_trigger
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

-- Function pour créer notification sur commentaire
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Récupérer l'ID du propriétaire du post
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;

  -- Ne pas notifier si on commente son propre post
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id, comment_id, content)
    VALUES (post_owner_id, NEW.user_id, 'comment', NEW.post_id, NEW.id, NEW.content);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_notification_trigger
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

-- Function pour créer notification sur follow
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follow_notification_trigger
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_notification();

-- Function pour nettoyer les stories expirées (à exécuter périodiquement)
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.stories WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Vues utiles pour le feed
-- ============================================

-- Vue pour le feed personnalisé (posts des comptes suivis)
CREATE OR REPLACE VIEW user_feed AS
SELECT
  p.*,
  u.username,
  u.display_name,
  u.profile_picture_url,
  u.is_verified,
  EXISTS(
    SELECT 1 FROM public.likes l
    WHERE l.post_id = p.id AND l.user_id = auth.uid()
  ) as is_liked_by_me
FROM public.posts p
JOIN public.users u ON p.user_id = u.id
WHERE p.user_id IN (
  SELECT following_id FROM public.follows WHERE follower_id = auth.uid()
)
OR p.user_id = auth.uid()
ORDER BY p.created_at DESC;

-- Vue pour explorer (posts populaires du Québec)
CREATE OR REPLACE VIEW explore_feed AS
SELECT
  p.*,
  u.username,
  u.display_name,
  u.profile_picture_url,
  u.is_verified,
  (p.likes_count * 2 + p.comments_count * 3 + p.views_count * 0.1) as engagement_score
FROM public.posts p
JOIN public.users u ON p.user_id = u.id
WHERE p.is_public = TRUE
AND p.region IS NOT NULL
ORDER BY engagement_score DESC, p.created_at DESC;

-- ============================================
-- Commentaires
-- ============================================

COMMENT ON TABLE public.posts IS 'Publications (photos/vidéos) style TikTok/Instagram';
COMMENT ON TABLE public.likes IS 'J''aime sur les publications';
COMMENT ON TABLE public.comments IS 'Commentaires sur les publications';
COMMENT ON TABLE public.follows IS 'Relations abonnés/abonnements entre utilisateurs';
COMMENT ON TABLE public.stories IS 'Histoires éphémères (24h) style Instagram/Snapchat';
COMMENT ON TABLE public.hashtags IS 'Hashtags et tendances';
COMMENT ON TABLE public.notifications IS 'Notifications pour les utilisateurs';
