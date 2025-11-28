# Video Orchestrator Service

FastAPI service for coordinating the video generation pipeline.

## Endpoints

### POST `/api/video/generate`
Create a new video generation job.

**Request:**
```json
{
  "prompt": "A 30-second ad for a new coffee brand",
  "duration_seconds": 30,
  "style": "professional",
  "voice_settings": {
    "voice_id": "uuid",
    "language": "en"
  }
}
```

**Response:**
```json
{
  "job_id": "uuid",
  "status": "pending",
  "queue_position": 3
}
```

### GET `/api/video/jobs/{job_id}`
Get the status of a video generation job.

**Response:**
```json
{
  "job_id": "uuid",
  "status": "processing",
  "progress": 65,
  "current_stage": "video_generation",
  "estimated_time_remaining": 120,
  "assets": {
    "intermediate_renders": [],
    "audio_track": null,
    "final_video": null
  }
}
```

### POST `/api/video/plan-scenes`
Generate scene plans from a script.

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run with Docker
docker build -t video-orchestrator .
docker run -p 8000:8000 video-orchestrator
```

## Environment Variables

- `REDIS_URL` - Redis connection URL
- `WHISPER_API_URL` - Whisper API service URL
- `CHATTERBOX_API_URL` - Chatterbox TTS service URL
- `COMFYUI_URL` - ComfyUI service URL
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase service key

