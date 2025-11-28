# Kolony Quick Start Guide

## Overview

Kolony is a dual-platform system combining:
1. **Ad Campaign Management Platform** - Manage campaigns across Facebook, Google, LinkedIn, etc.
2. **AI Video Generation Pipeline** - Generate professional video ads using open-source AI models

## Architecture at a Glance

### Video Generation Stack
- **HunyuanVideo** (13B) - Video generation
- **ComfyGPT** - LLM-to-workflow bridge
- **UniVA** - Multi-agent orchestration
- **Chatterbox TTS** - Voice synthesis
- **Lucy Edit** - Video editing
- **Whisper Turbo** - Speech-to-text

### Technology Stack
- **Frontend**: Next.js 14+ (or current vanilla JS)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Video Pipeline**: Python FastAPI microservices
- **Queue**: Redis (Bull/BullMQ)
- **Orchestration**: LangGraph

## Getting Started

### 1. Prerequisites

```bash
# Required
- Node.js 18+
- Docker & Docker Compose
- Supabase account
- GPU access (cloud or local)

# Optional but recommended
- Python 3.10+
- Redis
```

### 2. Initial Setup

```bash
# Clone repository
git clone https://github.com/brandonlacoste9-tech/Koloni.git
cd Koloni

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials
```

### 3. Database Setup

```bash
# Run database migrations
# In Supabase SQL editor, run:
# - database/schema.sql (existing)
# - database/video_generation_schema.sql (new)
```

### 4. Start Development Services

```bash
# Start Netlify dev server
npm run dev

# Start video pipeline services (separate terminal)
docker-compose up -d
```

## Key Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete architecture overview
- **[IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)** - 6-month implementation plan
- **[VIDEO_PIPELINE_SPEC.md](./VIDEO_PIPELINE_SPEC.md)** - Video generation API specs
- **[VIDEO_GENERATION_SETUP.md](./VIDEO_GENERATION_SETUP.md)** - Video feature setup guide

## Current Status

### ✅ Completed
- Basic campaign platform structure
- Text content generation (LongCat, Emu)
- User authentication
- Token management
- Landing page

### 🚧 In Progress
- Video generation backend function
- Video generation frontend integration

### 📋 Planned
- Full video generation pipeline
- Platform API integrations (Facebook, Google)
- Advanced analytics
- A/B testing framework

## Next Steps

1. **Review Architecture**: Read [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Set Up Infrastructure**: Follow Phase 0 in [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)
3. **Configure Video Pipeline**: See [VIDEO_GENERATION_SETUP.md](./VIDEO_GENERATION_SETUP.md)
4. **Start Development**: Begin with Phase 1-3 (Campaign Platform)

## Support

- **Documentation**: `/docs` directory
- **Issues**: GitHub Issues
- **Architecture Questions**: See [ARCHITECTURE.md](./ARCHITECTURE.md)

---

**Last Updated**: 2025-01-XX

