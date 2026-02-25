-- Phase 1: Rename bujji_* tables to ai_* tables
ALTER TABLE public.bujji_log RENAME TO ai_log;
ALTER TABLE public.bujji_questions RENAME TO ai_questions;
ALTER TABLE public.bujji_status RENAME TO ai_status;

-- Extend users table for ClawBuddy SaaS features
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS ai_name text NOT NULL DEFAULT 'Ray',
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS webhook_secret text UNIQUE DEFAULT gen_random_uuid()::text,
ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS theme_preference text NOT NULL DEFAULT 'dark';

-- Add user_id to ai_log for multi-tenant support
ALTER TABLE public.ai_log 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add user_id to ai_questions for multi-tenant support
ALTER TABLE public.ai_questions 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add user_id to ai_status for multi-tenant support (one status per user)
ALTER TABLE public.ai_status 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add user_id to raw_reports for multi-tenant webhook support
ALTER TABLE public.raw_reports 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add user_id to reports for multi-tenant support
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create index on webhook_secret for fast lookup
CREATE INDEX IF NOT EXISTS idx_users_webhook_secret ON public.users(webhook_secret);

-- Update RLS policies for ai_log to be user-specific
DROP POLICY IF EXISTS "Anyone can create log" ON public.ai_log;
DROP POLICY IF EXISTS "Anyone can delete log" ON public.ai_log;
DROP POLICY IF EXISTS "Anyone can update log" ON public.ai_log;
DROP POLICY IF EXISTS "Anyone can view log" ON public.ai_log;

CREATE POLICY "Users can view their own ai_log" ON public.ai_log
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own ai_log" ON public.ai_log
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own ai_log" ON public.ai_log
FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own ai_log" ON public.ai_log
FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Update RLS policies for ai_questions to be user-specific
DROP POLICY IF EXISTS "Anyone can create questions" ON public.ai_questions;
DROP POLICY IF EXISTS "Anyone can update questions" ON public.ai_questions;
DROP POLICY IF EXISTS "Anyone can view questions" ON public.ai_questions;

CREATE POLICY "Users can view their own ai_questions" ON public.ai_questions
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own ai_questions" ON public.ai_questions
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own ai_questions" ON public.ai_questions
FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Update RLS policies for ai_status to be user-specific
DROP POLICY IF EXISTS "Anyone can view Bujji status" ON public.ai_status;

CREATE POLICY "Users can view their own ai_status" ON public.ai_status
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own ai_status" ON public.ai_status
FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own ai_status" ON public.ai_status
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Update RLS policies for raw_reports to be user-specific
DROP POLICY IF EXISTS "Anyone can create raw_reports" ON public.raw_reports;
DROP POLICY IF EXISTS "Anyone can delete raw_reports" ON public.raw_reports;
DROP POLICY IF EXISTS "Anyone can update raw_reports" ON public.raw_reports;
DROP POLICY IF EXISTS "Anyone can view raw_reports" ON public.raw_reports;

CREATE POLICY "Users can view their own raw_reports" ON public.raw_reports
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own raw_reports" ON public.raw_reports
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own raw_reports" ON public.raw_reports
FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own raw_reports" ON public.raw_reports
FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Update RLS policies for reports to be user-specific
DROP POLICY IF EXISTS "Anyone can create reports" ON public.reports;
DROP POLICY IF EXISTS "Anyone can delete reports" ON public.reports;
DROP POLICY IF EXISTS "Anyone can update reports" ON public.reports;
DROP POLICY IF EXISTS "Anyone can view reports" ON public.reports;

CREATE POLICY "Users can view their own reports" ON public.reports
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own reports" ON public.reports
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own reports" ON public.reports
FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own reports" ON public.reports
FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);