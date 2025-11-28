# Video Generation Pipeline Specification

## Architecture Overview

The video generation pipeline follows a multi-stage process orchestrated by UniVA's Plan-and-Act architecture:

```
User Input (Script/Text)
    ↓
Whisper Turbo (Speech-to-Text, if audio input)
    ↓
Llama 3 8B (Scene Planning & Decomposition)
    ↓
ComfyGPT (Workflow Generation)
    ↓
ComfyUI + HunyuanVideo (Video Generation)
    ↓
Chatterbox TTS (Voiceover Synthesis)
    ↓
Lucy Edit (Instruction-Guided Editing)
    ↓
FFmpeg (Assembly & Transcoding)
    ↓
Final Video Asset
```

## API Contracts

### 1. Video Generation Job API

#### Endpoint: `POST /api/video/generate`

**Request:**
```json
{
  "prompt": "A 30-second ad for a new coffee brand showing morning routine",
  "campaign_id": "uuid-optional",
  "duration_seconds": 30,
  "style": "professional",
  "voice_settings": {
    "voice_id": "uuid",
    "language": "en",
    "emotion": "energetic"
  },
  "editing_instructions": [
    {
      "type": "text_overlay",
      "text": "Try it today!",
      "timestamp": 25.0
    }
  ],
  "brand_guidelines_id": "uuid-optional"
}
```

**Response:**
```json
{
  "job_id": "uuid",
  "status": "pending",
  "estimated_completion_time": "2025-01-XX 10:30:00Z",
  "queue_position": 3
}
```

### 2. Job Status API

#### Endpoint: `GET /api/video/jobs/:job_id`

**Response:**
```json
{
  "job_id": "uuid",
  "status": "processing",
  "progress": 65,
  "current_stage": "video_generation",
  "estimated_time_remaining": 120,
  "assets": {
    "intermediate_renders": ["url1", "url2"],
    "audio_track": "url",
    "final_video": null
  },
  "error": null
}
```

### 3. Scene Planning API (Internal)

#### Endpoint: `POST /api/video/plan-scenes`

**Request:**
```json
{
  "script": "Full script text",
  "duration_seconds": 30,
  "style_preferences": {}
}
```

**Response:**
```json
{
  "scenes": [
    {
      "scene_number": 1,
      "description": "Wide shot of morning kitchen",
      "duration_seconds": 5,
      "entities": [
        {"type": "person", "position": "center", "action": "pouring_coffee"}
      ],
      "visual_style": {
        "lighting": "warm",
        "color_palette": "earth_tones"
      }
    }
  ]
}
```

### 4. Workflow Generation API (ComfyGPT)

#### Endpoint: `POST /api/video/generate-workflow`

**Request:**
```json
{
  "scenes": [...],
  "template_id": "uuid-optional",
  "parameters": {}
}
```

**Response:**
```json
{
  "workflow_id": "comfyui-workflow-id",
  "workflow_json": {...},
  "estimated_gpu_time": 180
}
```

## Service Communication

### Redis Job Queue

Jobs are queued using Bull/BullMQ with the following structure:

```javascript
{
  id: "job-uuid",
  data: {
    job_id: "uuid",
    user_id: "uuid",
    prompt: "...",
    stages: ["planning", "generation", "editing", "assembly"]
  },
  opts: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000
    }
  }
}
```

### Queue Names
- `video:planning` - Scene planning jobs
- `video:generation` - Video generation jobs
- `video:editing` - Editing operations
- `video:assembly` - Final assembly jobs

## Error Handling

### Retry Logic

1. **Transient Errors** (network, temporary GPU unavailability):
   - Retry with exponential backoff (3 attempts)
   - Max delay: 5 minutes

2. **Permanent Errors** (invalid prompt, unsupported format):
   - Mark job as failed
   - Store error message
   - Notify user via webhook/email

3. **Partial Failures** (scene generation fails):
   - Fallback to simpler scene description
   - Continue with remaining scenes
   - Log warning

### Fallback Workflows

If primary workflow fails:
1. Try simplified workflow template
2. Reduce video quality/resolution
3. Use cached intermediate assets if available

## Content Moderation

### Pre-Generation Checks
- Text content analysis (OpenAI Moderation API)
- Brand guideline compliance
- Platform policy compliance (Facebook, Google, etc.)

### Post-Generation Checks
- Video content analysis (frame sampling)
- Audio content analysis
- Flag for manual review if needed

## Performance Optimization

### Caching Strategy
- Cache scene plans for similar prompts
- Cache workflow templates
- Cache intermediate renders for editing operations

### Batch Processing
- Batch multiple scene generations
- Batch audio synthesis requests
- Parallel processing where possible

### GPU Utilization
- Queue management to maximize GPU usage
- Priority queue for paid users
- Pre-emption for high-priority jobs

## Monitoring & Metrics

### Key Metrics
- Job completion rate
- Average processing time per stage
- GPU utilization percentage
- Error rate by error type
- Cost per video generation

### Alerts
- High error rate (>5%)
- Queue backup (>100 jobs)
- GPU unavailability
- Storage quota warnings

## Security

### Authentication
- JWT tokens for API access
- Service-to-service authentication via API keys

### Data Privacy
- User data encrypted at rest
- Temporary storage cleanup after 7 days
- Secure asset URLs with expiration

### Rate Limiting
- Per-user rate limits based on subscription tier
- Burst allowance for premium users
- Queue priority based on tier

---

**Last Updated**: 2025-01-XX
**Version**: 1.0

