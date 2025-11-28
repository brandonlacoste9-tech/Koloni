-- Migration: 001_video_generation_tables
-- Description: Create video generation related tables
-- Created: 2025-01-XX

-- Video Generation Jobs Table
CREATE TABLE IF NOT EXISTS video_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    comfyui_workflow_id TEXT,
    comfyui_job_id TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Scene Plans Table
CREATE TABLE IF NOT EXISTS scene_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES video_generation_jobs(id) ON DELETE CASCADE,
    scene_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    entity_layouts JSONB DEFAULT '{}',
    duration_seconds FLOAT,
    visual_style JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, scene_number)
);

-- Workflow Templates Table
CREATE TABLE IF NOT EXISTS workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    comfyui_workflow JSONB NOT NULL,
    parameters JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice Library Table
CREATE TABLE IF NOT EXISTS voice_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL,
    voice_sample_url TEXT,
    emotion_profile JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Editing Operations Table
CREATE TABLE IF NOT EXISTS editing_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES video_generation_jobs(id) ON DELETE CASCADE,
    operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('edit', 'segment', 'composite', 'transform')),
    univa_tool_invocation JSONB NOT NULL,
    timestamp_start FLOAT,
    timestamp_end FLOAT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    result_asset_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Asset Library Table
CREATE TABLE IF NOT EXISTS asset_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES video_generation_jobs(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('video', 'audio', 'render', 'intermediate', 'thumbnail')),
    storage_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    duration_seconds FLOAT,
    width INTEGER,
    height INTEGER,
    fps FLOAT,
    format VARCHAR(20),
    metadata JSONB DEFAULT '{}',
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for editing_operations.result_asset_id
ALTER TABLE editing_operations 
ADD CONSTRAINT fk_editing_operations_asset 
FOREIGN KEY (result_asset_id) REFERENCES asset_library(id) ON DELETE SET NULL;

-- Video Generation History Table
CREATE TABLE IF NOT EXISTS video_generation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES video_generation_jobs(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    parent_job_id UUID REFERENCES video_generation_jobs(id) ON DELETE SET NULL,
    change_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, version_number)
);

-- Video Performance Metrics Table
CREATE TABLE IF NOT EXISTS video_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES video_generation_jobs(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    impressions BIGINT DEFAULT 0,
    views BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    conversions BIGINT DEFAULT 0,
    engagement_rate FLOAT,
    cost_per_view FLOAT,
    cost_per_click FLOAT,
    roas FLOAT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, platform, date)
);

-- Brand Guidelines Table
CREATE TABLE IF NOT EXISTS brand_guidelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color_palette JSONB DEFAULT '[]',
    typography JSONB DEFAULT '{}',
    logo_url TEXT,
    style_preferences JSONB DEFAULT '{}',
    voice_tone JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_video_jobs_user_id ON video_generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_campaign_id ON video_generation_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_status ON video_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_video_jobs_created_at ON video_generation_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scene_plans_job_id ON scene_plans(job_id);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_public ON workflow_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_created_by ON workflow_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_voice_library_language ON voice_library(language);
CREATE INDEX IF NOT EXISTS idx_voice_library_default ON voice_library(is_default);
CREATE INDEX IF NOT EXISTS idx_editing_ops_job_id ON editing_operations(job_id);
CREATE INDEX IF NOT EXISTS idx_editing_ops_type ON editing_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_editing_ops_status ON editing_operations(status);
CREATE INDEX IF NOT EXISTS idx_asset_library_job_id ON asset_library(job_id);
CREATE INDEX IF NOT EXISTS idx_asset_library_type ON asset_library(asset_type);
CREATE INDEX IF NOT EXISTS idx_asset_library_final ON asset_library(is_final);
CREATE INDEX IF NOT EXISTS idx_video_history_job_id ON video_generation_history(job_id);
CREATE INDEX IF NOT EXISTS idx_video_history_parent ON video_generation_history(parent_job_id);
CREATE INDEX IF NOT EXISTS idx_video_metrics_job_id ON video_performance_metrics(job_id);
CREATE INDEX IF NOT EXISTS idx_video_metrics_campaign_id ON video_performance_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_video_metrics_date ON video_performance_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_brand_guidelines_user_id ON brand_guidelines(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_guidelines_active ON brand_guidelines(is_active);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_video_jobs_updated_at ON video_generation_jobs;
CREATE TRIGGER update_video_jobs_updated_at 
    BEFORE UPDATE ON video_generation_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_templates_updated_at ON workflow_templates;
CREATE TRIGGER update_workflow_templates_updated_at 
    BEFORE UPDATE ON workflow_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brand_guidelines_updated_at ON brand_guidelines;
CREATE TRIGGER update_brand_guidelines_updated_at 
    BEFORE UPDATE ON brand_guidelines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default voice library entries
INSERT INTO voice_library (name, language, is_default) VALUES
    ('Default English', 'en', TRUE),
    ('Default Spanish', 'es', FALSE),
    ('Default French', 'fr', FALSE),
    ('Default German', 'de', FALSE),
    ('Default Chinese', 'zh', FALSE)
ON CONFLICT DO NOTHING;

