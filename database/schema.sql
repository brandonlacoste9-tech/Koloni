-- Koloni Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- Users Table (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  credits INTEGER DEFAULT 10 NOT NULL, -- Free tier: 10 credits
  total_generations INTEGER DEFAULT 0 NOT NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Content Generations Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('longcat', 'emu', 'ad', 'blog')),
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  options JSONB DEFAULT '{}'::jsonb,
  tokens_used INTEGER,
  credits_used INTEGER NOT NULL,
  processing_time INTEGER, -- milliseconds
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Credit Transactions Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for additions, negative for deductions
  type TEXT NOT NULL CHECK (type IN ('purchase', 'generation', 'refund', 'bonus', 'subscription')),
  description TEXT,
  generation_id UUID REFERENCES public.generations(id) ON DELETE SET NULL,
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_type ON public.generations(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users Table Policies
CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Generations Table Policies
CREATE POLICY "Users can view own generations"
  ON public.generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generations"
  ON public.generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations"
  ON public.generations FOR DELETE
  USING (auth.uid() = user_id);

-- Credit Transactions Policies
CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, credits)
  VALUES (NEW.id, NEW.email, 10)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user record
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Insert test content types reference data
COMMENT ON TABLE public.generations IS 'Stores all AI-generated content with metadata';
COMMENT ON COLUMN public.generations.type IS 'Content type: longcat (long-form), emu (short-form), ad (advertising), blog (blog post)';
COMMENT ON COLUMN public.generations.credits_used IS 'Credits consumed: longcat=5, emu=1, ad=2, blog=4';

COMMENT ON TABLE public.users IS 'Extended user data with credits and subscription info';
COMMENT ON COLUMN public.users.credits IS 'Available credits for content generation. Free tier starts with 10';
COMMENT ON COLUMN public.users.subscription_tier IS 'Subscription level: free (10 credits), pro (unlimited), enterprise (unlimited + features)';

-- ============================================
-- Useful Queries
-- ============================================

-- Get user stats
-- SELECT 
--   u.email,
--   u.credits,
--   u.total_generations,
--   u.subscription_tier,
--   COUNT(g.id) as generation_count,
--   SUM(g.credits_used) as total_credits_used
-- FROM users u
-- LEFT JOIN generations g ON u.id = g.user_id
-- GROUP BY u.id, u.email, u.credits, u.total_generations, u.subscription_tier;

-- Get recent generations
-- SELECT 
--   g.created_at,
--   g.type,
--   g.prompt,
--   g.credits_used,
--   g.processing_time,
--   u.email
-- FROM generations g
-- JOIN users u ON g.user_id = u.id
-- ORDER BY g.created_at DESC
-- LIMIT 10;
