# Kolony Architecture Plan

## Overview

Kolony combines cutting-edge open-source technologies into a dual-platform system: an ad campaign management platform with an integrated AI video generation pipeline.

## Video Generation Stack

### Core Technologies

#### 1. **HunyuanVideo** (13B parameters)
- Most powerful open-source video model
- Extensions:
  - HunyuanVideo-I2V (image-to-video, March 2025)
  - HunyuanVideo-Avatar (audio-driven animation, May 2025)
- Outperforms Runway Gen-3 and Luma 1.6
- FP8 quantized versions available for smaller GPU deployments
- **VRAM Requirements**: 40-48GB recommended

#### 2. **ComfyGPT**
- LLM-to-workflow bridge
- Four-agent system:
  - ReformatAgent
  - FlowAgent
  - RefineAgent
  - ExecuteAgent
- Generates individual node links (not complete workflows)
- Supervised fine-tuning with GRPO algorithms
- Autonomous error correction during workflow generation

#### 3. **UniVA** (Multi-Agent Orchestration)
- Plan-and-Act dual-agent architecture:
  - **Planner Agent**: Interprets intentions, decomposes into structured steps
  - **Executor Agents**: Execute through modular MCP-based tool servers
- Supports iterative workflows:
  - Text-conditioned generation
  - Multi-round editing
  - Object segmentation
  - Compositional synthesis

#### 4. **Chatterbox TTS**
- Outperforms ElevenLabs (63.75% user preference in blind tests)
- MIT licensing
- Emotion control
- 22 languages supported
- Neural watermarking
- Trained on 500K hours of cleaned data
- OpenAI-compatible API endpoints

#### 5. **Lucy Edit**
- First open-source instruction-guided video editing model
- 81-frame generations with motion preservation
- Built on Wan2.2 5B architecture
- Text-guided edits without masks or fine-tuning
- Maintains natural motion and composition
- **VRAM Requirements**: 12-18GB

#### 6. **Whisper Large V3 Turbo**
- 5.4x faster than V3 Large
- Minimal WER degradation
- ~130x real-time speed with batched processing
- Reduced decoder layers (32 → 4)
- Maintains accuracy across multilingual audio

## Hardware Requirements

### Minimum Configuration
- **24GB VRAM** (insufficient for full pipeline)

### Recommended Configuration
- **HunyuanVideo full model**: 40-48GB VRAM
- **Llama 3 8B**: 12-16GB VRAM
- **Lucy Edit (Wan2.2 5B)**: 12-18GB VRAM
- **Combined pipeline**: 60-80GB VRAM for smooth operation

### Deployment Strategy
- **Cloud GPUs** (Modal, Runpod, Vast.ai) for video generation and editing models
- **Local/cheaper compute** for Whisper Turbo and orchestration LLMs

## Platform Integration

### Ad Platform APIs

#### Phase 1 (Priority)
- **Facebook/Meta Business Suite API**
  - Business verification required
  - App review: 2-4 weeks
- **Google Ads API**
  - Developer token required
  - Manager account approval needed

#### Phase 2 (Future)
- **LinkedIn Marketing Developer Platform** (strict access requirements)
- **Twitter/X API** (Enterprise tier: $42,000/month)
- **TikTok Marketing API**
- **Snapchat Ads API**

## Database Schema

### Campaign Management Tables
- `users`
- `campaigns`
- `ad_sets`
- `ads`
- `platforms`
- `analytics`
- `billing`
- `settings`

### Video Generation Tables

#### `video_generation_jobs`
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → users)
- `campaign_id` (UUID, foreign key → campaigns, nullable)
- `prompt` (text)
- `status` (enum: pending, processing, completed, failed)
- `comfyui_workflow_id` (text)
- `comfyui_job_id` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `completed_at` (timestamp, nullable)
- `error_message` (text, nullable)

#### `scene_plans`
- `id` (UUID, primary key)
- `job_id` (UUID, foreign key → video_generation_jobs)
- `scene_number` (integer)
- `description` (text)
- `entity_layouts` (jsonb)
- `duration_seconds` (float)
- `created_at` (timestamp)

#### `workflow_templates`
- `id` (UUID, primary key)
- `name` (text)
- `description` (text)
- `comfyui_workflow` (jsonb)
- `parameters` (jsonb)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `voice_library`
- `id` (UUID, primary key)
- `name` (text)
- `language` (text)
- `voice_sample_url` (text)
- `emotion_profile` (jsonb)
- `created_at` (timestamp)

#### `editing_operations`
- `id` (UUID, primary key)
- `job_id` (UUID, foreign key → video_generation_jobs)
- `operation_type` (enum: edit, segment, composite)
- `univa_tool_invocation` (jsonb)
- `timestamp_start` (float)
- `timestamp_end` (float)
- `created_at` (timestamp)

#### `asset_library`
- `id` (UUID, primary key)
- `job_id` (UUID, foreign key → video_generation_jobs)
- `asset_type` (enum: video, audio, render, intermediate)
- `storage_url` (text)
- `storage_path` (text)
- `file_size_bytes` (bigint)
- `duration_seconds` (float, nullable)
- `metadata` (jsonb)
- `created_at` (timestamp)

## Implementation Phases

### Phase 0: Infrastructure Setup (Week 1-2)
- [ ] Configure Supabase project with RLS policies
- [ ] Set up ComfyUI server with custom nodes (ComfyUI-LLM-API, HunyuanVideo models)
- [ ] Deploy Whisper Turbo API endpoint
- [ ] Install Chatterbox TTS with voice cloning capabilities
- [ ] Establish LangGraph orchestration environment for multi-agent coordination
- [ ] Create Docker containers for each service component

### Phase 1-3: Campaign Platform Foundation (Week 3-6)
- [ ] Authentication and onboarding
- [ ] Core campaign features
- [ ] Facebook API integration
- [ ] Google Ads API integration
- [ ] Placeholder UI for other platforms

### Phase 4: Video Generation Integration (Week 7-10)
- [ ] Speech-to-text pipeline with Whisper Turbo
- [ ] LLM planning agent with Llama 3 8B for scene decomposition
- [ ] ComfyGPT API integration for automated workflow generation
- [ ] HunyuanVideo generation queue with job status tracking
- [ ] Chatterbox TTS for voiceover synthesis with timestamp synchronization
- [ ] UniVA editing framework with Plan-Act architecture

### Phase 5: Video-Campaign Bridge (Week 11-12)
- [ ] "Generate Video Ad" wizard within campaign creation flow
- [ ] Link generated videos to campaign assets
- [ ] Video preview and approval workflow
- [ ] Video-to-platform format conversion (aspect ratios, durations)
- [ ] Track video performance metrics alongside campaign analytics

### Phase 6-8: Complete Remaining Features (Week 13-20)
- [ ] Analytics dashboard
- [ ] Settings and preferences
- [ ] Email automation
- [ ] UX enhancements

## Technology Stack

### Backend Services
- **Next.js 14+** with App Router
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Redis** for job queue management (Bull or BullMQ)
- **Python FastAPI** for video generation microservices
- **LangGraph** for agent orchestration

### Video Pipeline
- **ComfyUI** backend with GPU cluster access
- **FFmpeg** for video assembly and transcoding
- **S3-compatible storage** (Supabase Storage or Cloudflare R2)

### Monitoring
- **Sentry** for error tracking
- **Prometheus + Grafana** for video generation metrics
- **Supabase dashboard** for database monitoring

## Cost Projections

### Monthly Infrastructure Costs (100 active users)
- Supabase Pro: $25
- GPU compute (Modal/Runpod): $500-1,500
- Storage (100GB): $23
- Vercel Pro: $20
- **Total: $568-1,568/month**

### Per-Video Generation Cost
- GPU time (2-5 minutes per video): $0.15-0.40
- Storage and bandwidth: $0.02-0.05
- **Total: $0.17-0.45 per video**

## Missing Components

1. **Error handling** for failed video generations (retry logic, fallback workflows)
2. **Content moderation API** integration to prevent policy-violating ads
3. **Version control** for generated videos and editing history
4. **Collaborative features** for team-based campaign management
5. **A/B testing framework** for comparing video ad variants
6. **Brand guidelines system** to ensure consistency across generated content
7. **Analytics bridge** connecting video engagement metrics to campaign ROAS

## Next Steps

### Immediate Actions
1. Set up development environment with Supabase project and database schema
2. Create proof-of-concept video generation pipeline (Whisper → Llama 3 → ComfyGPT → HunyuanVideo)
3. Test hardware requirements with chosen GPU configuration
4. Apply for platform API access (start Facebook and Google immediately)
5. Design database schema with both campaign management and video generation tables
6. Create technical specification document with API contracts between services

## Timeline

**Minimum Viable Product**: 6 months

**Recommended Approach**: 
- Start with Phase 1-3 (campaign platform) as standalone product
- Add video generation capabilities in second release
- De-risks development and allows revenue generation earlier
- Refine AI video pipeline once core platform demonstrates product-market fit

---

**Last Updated**: 2025-01-XX
**Status**: Planning Phase

