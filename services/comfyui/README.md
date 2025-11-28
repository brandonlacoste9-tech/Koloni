# ComfyUI API Wrapper Service

FastAPI wrapper service for ComfyUI, providing a REST API interface for video generation workflows with HunyuanVideo.

## Overview

This service acts as a bridge between the Kolony platform and ComfyUI, allowing:
- Workflow submission and management
- Job status tracking
- Queue management
- Integration with HunyuanVideo for video generation
- ComfyGPT workflow generation (when integrated)

## Prerequisites

- ComfyUI server running (separate service/container)
- HunyuanVideo models installed in ComfyUI
- ComfyUI custom nodes (if needed)

## API Endpoints

### POST `/api/workflow/submit`
Submit a ComfyUI workflow for execution.

**Request:**
```json
{
  "workflow": {
    "prompt": {
      // ComfyUI workflow JSON structure
    }
  },
  "prompt": "Optional text prompt",
  "extra_data": {}
}
```

**Response:**
```json
{
  "prompt_id": "uuid",
  "status": "pending",
  "message": "Workflow submitted successfully"
}
```

### GET `/api/workflow/status/{prompt_id}`
Get the status of a workflow execution.

**Response:**
```json
{
  "prompt_id": "uuid",
  "status": "running",
  "progress": 50.0,
  "current_node": null,
  "output_images": [],
  "output_videos": [
    "http://comfyui:8188/view?filename=video_123.mp4"
  ],
  "error": null,
  "estimated_time_remaining": 120
}
```

### GET `/api/queue`
Get current queue status.

**Response:**
```json
{
  "running": [
    ["1", "prompt_id_1", {}]
  ],
  "pending": [
    ["2", "prompt_id_2", {}]
  ]
}
```

### POST `/api/workflow/cancel/{prompt_id}`
Cancel a running or pending workflow.

### GET `/api/models`
Get list of available models in ComfyUI.

### POST `/api/video/generate`
Generate video using HunyuanVideo (when implemented).

**Request:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "duration": 5,
  "resolution": "512x512",
  "style": "cinematic",
  "extra_params": {}
}
```

### GET `/health`
Health check endpoint.

## ComfyUI Setup

### Installing ComfyUI

ComfyUI should be set up as a separate service. Here's a basic setup:

```bash
# Clone ComfyUI
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Install dependencies
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt

# Install custom nodes (if needed)
cd custom_nodes
git clone <custom-node-repo>
```

### Installing HunyuanVideo

1. Download HunyuanVideo models
2. Place in ComfyUI's `models/checkpoints/` directory
3. Install any required custom nodes for HunyuanVideo

### Running ComfyUI

```bash
# Run ComfyUI server
python main.py --port 8188
```

Or use Docker (see ComfyUI documentation for official images).

## Integration with ComfyGPT

ComfyGPT integration allows automatic workflow generation from text prompts:

1. **ReformatAgent**: Reformats user input
2. **FlowAgent**: Generates workflow structure
3. **RefineAgent**: Refines workflow details
4. **ExecuteAgent**: Validates and executes workflow

This service provides a stub endpoint (`/api/workflow/generate`) that will integrate with ComfyGPT when available.

## Workflow Structure

ComfyUI workflows are JSON structures defining nodes and connections. Example structure:

```json
{
  "prompt": {
    "1": {
      "inputs": {
        "text": "your prompt here"
      },
      "class_type": "CLIPTextEncode"
    },
    "2": {
      "inputs": {
        "model": ["1", 0],
        "seed": 12345
      },
      "class_type": "KSampler"
    }
  }
}
```

## HunyuanVideo Workflow

A typical HunyuanVideo workflow would include:
- Text prompt encoding
- HunyuanVideo model node
- Video decoding
- Output node

Example workflow structure (simplified):
```json
{
  "prompt": {
    "text_encode": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": "video prompt"
      }
    },
    "hunyuan_video": {
      "class_type": "HunyuanVideo",
      "inputs": {
        "prompt": ["text_encode", 0],
        "duration": 5,
        "resolution": "512x512"
      }
    },
    "video_output": {
      "class_type": "SaveVideo",
      "inputs": {
        "video": ["hunyuan_video", 0]
      }
    }
  }
}
```

## Development

### Local Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export COMFYUI_URL=http://localhost:8188

# Run the service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Using Docker

```bash
# Build image
docker build -t comfyui-api .

# Run container
docker run -p 8000:8000 \
  -e COMFYUI_URL=http://comfyui:8188 \
  comfyui-api
```

## Environment Variables

- `COMFYUI_URL`: URL of ComfyUI server (default: "http://localhost:8188")
- `WORKFLOW_TIMEOUT`: Timeout for workflow execution in seconds (default: 600)

## Queue Management

The service provides queue management capabilities:
- View running and pending jobs
- Cancel jobs
- Monitor queue position

## Error Handling

- **503 Service Unavailable**: ComfyUI server is not accessible
- **404 Not Found**: Workflow/job not found
- **400 Bad Request**: Invalid workflow structure
- **500 Internal Server Error**: Unexpected errors

## Performance Considerations

- ComfyUI can handle multiple concurrent workflows
- GPU memory limits may restrict parallel execution
- Queue system manages job execution order
- Long-running workflows may timeout (configurable)

## Security

- Configure CORS appropriately for production
- Add authentication/authorization as needed
- Validate workflow structures before submission
- Sanitize user inputs

## Future Enhancements

- [ ] ComfyGPT integration for automatic workflow generation
- [ ] Workflow templates and caching
- [ ] Progress tracking with WebSocket updates
- [ ] Batch workflow processing
- [ ] Workflow versioning
- [ ] Model management API

## Notes

- This service is a wrapper around ComfyUI's existing API
- ComfyUI must be running separately
- HunyuanVideo models must be installed in ComfyUI
- Custom nodes may be required for specific workflows

