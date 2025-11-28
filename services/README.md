# Video Pipeline Services

This directory contains microservices for the video generation pipeline.

## Services

### video-orchestrator
Main FastAPI service that coordinates the video generation pipeline.
- Handles job creation and status tracking
- Coordinates between different services
- Manages Redis job queues

### whisper-api (TODO)
Whisper Turbo API service for speech-to-text conversion.

### chatterbox-tts (TODO)
Chatterbox TTS service for voice synthesis.

### comfyui (TODO)
ComfyUI server for video generation workflows.

### langgraph-orchestrator (TODO)
LangGraph service for multi-agent orchestration and scene planning.

## Development

Each service should have:
- `Dockerfile` for containerization
- `requirements.txt` (Python) or `package.json` (Node.js)
- `README.md` with service-specific documentation
- Health check endpoint at `/health`

## Running Services

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d video-orchestrator

# View logs
docker-compose logs -f video-orchestrator
```

### Development Mode
```bash
# Use development override
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Service Communication

Services communicate via:
- **HTTP/REST APIs** for synchronous requests
- **Redis queues** for asynchronous job processing
- **Shared storage** (Supabase Storage) for assets

## Adding a New Service

1. Create service directory: `services/your-service/`
2. Add Dockerfile and dependencies
3. Add service to `docker-compose.yml`
4. Implement health check endpoint
5. Document in service README

