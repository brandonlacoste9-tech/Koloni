-- Migration: 002_rls_policies
-- Description: Enable Row Level Security and create policies for video generation tables
-- Created: 2025-01-XX

-- Enable RLS on all video generation tables
ALTER TABLE video_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE editing_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_guidelines ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own video jobs" ON video_generation_jobs;
DROP POLICY IF EXISTS "Users can insert their own video jobs" ON video_generation_jobs;
DROP POLICY IF EXISTS "Users can update their own video jobs" ON video_generation_jobs;
DROP POLICY IF EXISTS "Users can delete their own video jobs" ON video_generation_jobs;

-- Video Generation Jobs Policies
CREATE POLICY "Users can view their own video jobs"
    ON video_generation_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video jobs"
    ON video_generation_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video jobs"
    ON video_generation_jobs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video jobs"
    ON video_generation_jobs FOR DELETE
    USING (auth.uid() = user_id);

-- Scene Plans Policies
CREATE POLICY "Users can view scene plans for their jobs"
    ON scene_plans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM video_generation_jobs 
            WHERE video_generation_jobs.id = scene_plans.job_id 
            AND video_generation_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert scene plans for their jobs"
    ON scene_plans FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM video_generation_jobs 
            WHERE video_generation_jobs.id = scene_plans.job_id 
            AND video_generation_jobs.user_id = auth.uid()
        )
    );

-- Workflow Templates Policies
CREATE POLICY "Users can view public workflow templates"
    ON workflow_templates FOR SELECT
    USING (is_public = TRUE OR created_by = auth.uid());

CREATE POLICY "Users can insert their own workflow templates"
    ON workflow_templates FOR INSERT
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own workflow templates"
    ON workflow_templates FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own workflow templates"
    ON workflow_templates FOR DELETE
    USING (created_by = auth.uid());

-- Voice Library Policies (public read, admin write)
CREATE POLICY "Anyone can view voice library"
    ON voice_library FOR SELECT
    USING (TRUE);

-- Editing Operations Policies
CREATE POLICY "Users can view editing operations for their jobs"
    ON editing_operations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM video_generation_jobs 
            WHERE video_generation_jobs.id = editing_operations.job_id 
            AND video_generation_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert editing operations for their jobs"
    ON editing_operations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM video_generation_jobs 
            WHERE video_generation_jobs.id = editing_operations.job_id 
            AND video_generation_jobs.user_id = auth.uid()
        )
    );

-- Asset Library Policies
CREATE POLICY "Users can view assets for their jobs"
    ON asset_library FOR SELECT
    USING (
        job_id IS NULL OR EXISTS (
            SELECT 1 FROM video_generation_jobs 
            WHERE video_generation_jobs.id = asset_library.job_id 
            AND video_generation_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert assets for their jobs"
    ON asset_library FOR INSERT
    WITH CHECK (
        job_id IS NULL OR EXISTS (
            SELECT 1 FROM video_generation_jobs 
            WHERE video_generation_jobs.id = asset_library.job_id 
            AND video_generation_jobs.user_id = auth.uid()
        )
    );

-- Video Generation History Policies
CREATE POLICY "Users can view history for their jobs"
    ON video_generation_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM video_generation_jobs 
            WHERE video_generation_jobs.id = video_generation_history.job_id 
            AND video_generation_jobs.user_id = auth.uid()
        )
    );

-- Video Performance Metrics Policies
CREATE POLICY "Users can view metrics for their jobs"
    ON video_performance_metrics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM video_generation_jobs 
            WHERE video_generation_jobs.id = video_performance_metrics.job_id 
            AND video_generation_jobs.user_id = auth.uid()
        )
    );

-- Brand Guidelines Policies
CREATE POLICY "Users can view their own brand guidelines"
    ON brand_guidelines FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brand guidelines"
    ON brand_guidelines FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand guidelines"
    ON brand_guidelines FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brand guidelines"
    ON brand_guidelines FOR DELETE
    USING (auth.uid() = user_id);

