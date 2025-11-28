# LangGraph Orchestrator Service

Multi-agent orchestration service for scene planning and video generation workflow coordination using LangGraph and UniVA's Plan-and-Act architecture.

## Overview

This service coordinates the video generation pipeline using a multi-agent system:

1. **Planner Agent**: Interprets user intentions and decomposes them into structured steps
2. **Executor Agents**: Execute tasks through modular MCP-based tool servers
3. **Iterative Workflows**: Supports multi-round editing, refinement, and composition

## Architecture

### Plan-and-Act Dual-Agent System

- **Planner**: 
  - Analyzes scripts and requirements
  - Creates scene breakdowns
  - Generates workflow steps
  - Handles brand guidelines and style preferences

- **Executor**:
  - Executes scene generation
  - Performs editing operations
  - Handles object segmentation
  - Manages compositional synthesis

### Supported Workflows

1. **Text-Conditioned Generation**: Generate video from text prompts
2. **Multi-Round Editing**: Iterative refinement based on feedback
3. **Object Segmentation**: Extract and manipulate objects
4. **Compositional Synthesis**: Combine multiple elements

## API Endpoints

### POST `/api/plan/scenes`
Plan scenes from a script using multi-agent orchestration.

**Request:**
```json
{
  "script": "A 30-second ad showing a morning coffee routine...",
  "duration_seconds": 30,
  "style_preferences": {
    "tone": "warm",
    "color_palette": "earth_tones"
  },
  "brand_guidelines": {
    "logo_position": "bottom_right",
    "colors": ["#FF6B6B", "#4ECDC4"]
  }
}
```

**Response:**
```json
{
  "scenes": [
    {
      "scene_number": 1,
      "description": "Wide shot of morning kitchen",
      "duration_seconds": 5.0,
      "entities": [
        {
          "type": "person",
          "position": "center",
          "action": "pouring_coffee"
        }
      ],
      "visual_style": {
        "lighting": "warm",
        "color_palette": ["#FF6B6B", "#4ECDC4"]
      },
      "camera_angle": "wide_shot",
      "lighting": "natural_morning",
      "color_palette": ["#FF6B6B", "#4ECDC4", "#45B7D1"],
      "transitions": {
        "type": "fade",
        "duration": 0.5
      }
    }
  ],
  "total_duration": 30.0,
  "style_summary": {},
  "metadata": {
    "generated_at": "2025-01-XX...",
    "model": "gpt-4"
  }
}
```

### POST `/api/plan/workflow`
Plan video generation workflow from scenes.

**Request:**
```json
{
  "scenes": [...],
  "video_type": "hunyuan",
  "editing_requirements": [
    "add_text_overlay",
    "adjust_color_grading"
  ]
}
```

**Response:**
```json
{
  "workflow_steps": [
    {
      "step": "generate_scene",
      "scene_number": 1,
      "description": "...",
      "parameters": {...}
    }
  ],
  "estimated_time": 120,
  "resource_requirements": {
    "gpu_memory_gb": 40,
    "cpu_cores": 4,
    "storage_gb": 5
  }
}
```

### POST `/api/refine/scenes`
Refine scenes iteratively based on feedback.

**Request:**
```json
{
  "scenes": [...],
  "feedback": "Make the lighting brighter and add more movement",
  "iteration": 1
}
```

### POST `/api/tools/execute`
Execute a tool through MCP-based tool server.

**Request:**
```json
{
  "tool_name": "scene_generator",
  "parameters": {
    "prompt": "...",
    "duration": 5.0
  }
}
```

### GET `/health`
Health check endpoint.

## LLM Configuration

### Using OpenAI (Default)
```bash
export OPENAI_API_KEY=your_key
export LLM_MODEL=gpt-4
export USE_LLAMA=false
```

### Using Llama 3 8B (Local)
```bash
export USE_LLAMA=true
export LLAMA_MODEL_PATH=/models/llama3-8b
```

## Development

### Local Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY=your_key
export REDIS_URL=redis://localhost:6379

# Run the service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Using Docker

```bash
# Build image
docker build -t langgraph-orchestrator .

# Run container
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=your_key \
  -e REDIS_URL=redis://redis:6379 \
  -v /path/to/models:/models \
  langgraph-orchestrator
```

## Environment Variables

- `REDIS_URL`: Redis connection URL (default: "redis://redis:6379")
- `LLAMA_MODEL_PATH`: Path to Llama 3 model (default: "/models/llama3-8b")
- `OPENAI_API_KEY`: OpenAI API key (required if not using Llama)
- `USE_LLAMA`: Use Llama 3 instead of OpenAI (default: "false")
- `LLM_MODEL`: OpenAI model to use (default: "gpt-4")

## LangGraph Workflow

The service uses LangGraph to create a state machine for the planning process:

```
Start → Planner Agent → Executor Agent → End
         ↓
    (Iterative Refinement)
```

### State Management

The `AgentState` class manages:
- Script and scenes
- Current workflow steps
- Errors and iterations
- Tool execution results

## MCP Tool Servers

The executor agent communicates with MCP (Model Context Protocol) based tool servers:

- **Scene Generator**: Generates video scenes
- **Video Editor**: Performs editing operations
- **Asset Manager**: Manages video assets
- **Format Converter**: Converts between formats

## Integration with Video Pipeline

1. **Scene Planning**: User script → Planner Agent → Scene breakdown
2. **Workflow Generation**: Scenes → Workflow steps → ComfyUI
3. **Execution**: Workflow → Executor Agents → Tool servers
4. **Refinement**: Feedback → Iterative refinement → Updated scenes

## Performance

- **Scene Planning**: ~2-5 seconds per script
- **Workflow Planning**: ~1-2 seconds per workflow
- **Iterative Refinement**: ~3-5 seconds per iteration

## Future Enhancements

- [ ] Full MCP tool server integration
- [ ] Advanced iterative refinement
- [ ] Multi-agent collaboration
- [ ] Workflow caching
- [ ] Real-time progress updates
- [ ] Custom agent definitions

## Notes

- LangGraph provides the orchestration framework
- UniVA's Plan-Act architecture is implemented through the agent system
- MCP tool servers enable modular tool execution
- Supports both OpenAI and local Llama 3 models

