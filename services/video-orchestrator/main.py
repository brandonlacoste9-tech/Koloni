"""
Video Orchestrator Service
FastAPI service for coordinating video generation pipeline
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import os
from redis import Redis
import httpx
import json
import asyncio

app = FastAPI(title="Kolony Video Orchestrator", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection
redis_client = Redis(
    host=os.getenv("REDIS_URL", "redis://redis:6379").replace("redis://", "").split(":")[0],
    port=int(os.getenv("REDIS_URL", "redis://redis:6379").split(":")[-1]) if ":" in os.getenv("REDIS_URL", "redis://redis:6379") else 6379,
    decode_responses=True
)

# Service URLs
WHISPER_API_URL = os.getenv("WHISPER_API_URL", "http://whisper-api:8000")
CHATTERBOX_API_URL = os.getenv("CHATTERBOX_API_URL", "http://chatterbox-tts:8000")
COMFYUI_URL = os.getenv("COMFYUI_URL", "http://comfyui:8188")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


# Pydantic Models
class VideoGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=2000)
    campaign_id: Optional[str] = None
    duration_seconds: int = Field(default=30, ge=5, le=300)
    style: str = Field(default="professional")
    voice_settings: Optional[Dict[str, Any]] = None
    editing_instructions: Optional[List[Dict[str, Any]]] = None
    brand_guidelines_id: Optional[str] = None


class VideoGenerationResponse(BaseModel):
    job_id: str
    status: str
    estimated_completion_time: Optional[datetime] = None
    queue_position: Optional[int] = None


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int = Field(ge=0, le=100)
    current_stage: Optional[str] = None
    estimated_time_remaining: Optional[int] = None
    assets: Dict[str, Any] = {}
    error: Optional[str] = None


class ScenePlanRequest(BaseModel):
    script: str
    duration_seconds: int
    style_preferences: Optional[Dict[str, Any]] = None


class ScenePlanResponse(BaseModel):
    scenes: List[Dict[str, Any]]


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "video-orchestrator",
        "timestamp": datetime.utcnow().isoformat()
    }


# Video generation endpoint
@app.post("/api/video/generate", response_model=VideoGenerationResponse)
async def generate_video(
    request: VideoGenerationRequest,
    background_tasks: BackgroundTasks,
    user_id: str = None  # Should come from auth middleware
):
    """
    Create a new video generation job
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    job_id = str(uuid.uuid4())
    
    # Create job record in database (via Supabase)
    # TODO: Implement Supabase client integration
    
    # Queue job for processing
    job_data = {
        "job_id": job_id,
        "user_id": user_id,
        "prompt": request.prompt,
        "campaign_id": request.campaign_id,
        "duration_seconds": request.duration_seconds,
        "style": request.style,
        "voice_settings": request.voice_settings,
        "editing_instructions": request.editing_instructions,
        "brand_guidelines_id": request.brand_guidelines_id,
        "status": "pending"
    }
    
    # Add to Redis queue
    redis_client.lpush("video:planning", str(job_id))
    redis_client.hset(f"job:{job_id}", mapping=job_data)
    
    # Start background processing
    background_tasks.add_task(process_video_generation, job_id)
    
    return VideoGenerationResponse(
        job_id=job_id,
        status="pending",
        queue_position=redis_client.llen("video:planning")
    )


# Job status endpoint
@app.get("/api/video/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str, user_id: str = None):
    """
    Get the status of a video generation job
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Get job data from Redis
    job_data = redis_client.hgetall(f"job:{job_id}")
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Verify user owns this job
    if job_data.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get progress from queue
    progress = int(job_data.get("progress", 0))
    current_stage = job_data.get("current_stage", "pending")
    status = job_data.get("status", "pending")
    
    # Get assets
    assets = {
        "intermediate_renders": [],
        "audio_track": None,
        "final_video": None
    }
    
    # TODO: Fetch actual assets from database/storage
    
    return JobStatusResponse(
        job_id=job_id,
        status=status,
        progress=progress,
        current_stage=current_stage,
        estimated_time_remaining=int(job_data.get("estimated_time_remaining", 0)),
        assets=assets,
        error=job_data.get("error")
    )


# Scene planning endpoint
@app.post("/api/video/plan-scenes", response_model=ScenePlanResponse)
async def plan_scenes(request: ScenePlanRequest, user_id: str = None):
    """
    Generate scene plans from a script using LLM
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # TODO: Call LangGraph orchestrator for scene planning
    # For now, return mock data
    scenes = [
        {
            "scene_number": 1,
            "description": "Wide shot of morning kitchen",
            "duration_seconds": 5.0,
            "entities": [
                {"type": "person", "position": "center", "action": "pouring_coffee"}
            ],
            "visual_style": {
                "lighting": "warm",
                "color_palette": "earth_tones"
            }
        }
    ]
    
    return ScenePlanResponse(scenes=scenes)


# Import integration functions
from integration import (
    transcribe_audio,
    synthesize_speech,
    plan_scenes,
    plan_workflow,
    submit_video_generation,
    get_video_generation_status,
    check_service_health
)


# Background task for video generation
async def process_video_generation(job_id: str):
    """
    Background task to process video generation through the pipeline
    """
    try:
        # Get job data
        job_data = redis_client.hgetall(f"job:{job_id}")
        if not job_data:
            return
        
        # Update status to processing
        redis_client.hset(f"job:{job_id}", "status", "processing")
        redis_client.hset(f"job:{job_id}", "current_stage", "planning")
        redis_client.hset(f"job:{job_id}", "progress", "10")
        
        script = job_data.get("prompt", "")
        duration = int(job_data.get("duration_seconds", 30))
        style = job_data.get("style", "professional")
        
        # Stage 1: Scene Planning
        try:
            scene_plan = await plan_scenes(
                script=script,
                duration_seconds=duration,
                style_preferences={"style": style}
            )
            redis_client.hset(f"job:{job_id}", "scene_plan", json.dumps(scene_plan))
            redis_client.hset(f"job:{job_id}", "progress", "20")
        except Exception as e:
            raise Exception(f"Scene planning failed: {str(e)}")
        
        # Stage 2: Workflow Planning
        try:
            workflow_plan = await plan_workflow(
                scenes=scene_plan.get("scenes", []),
                video_type="hunyuan"
            )
            redis_client.hset(f"job:{job_id}", "workflow_plan", json.dumps(workflow_plan))
            redis_client.hset(f"job:{job_id}", "current_stage", "generation")
            redis_client.hset(f"job:{job_id}", "progress", "30")
        except Exception as e:
            raise Exception(f"Workflow planning failed: {str(e)}")
        
        # Stage 3: Video Generation
        try:
            # TODO: Convert workflow_plan to ComfyUI workflow format
            # For now, use a placeholder workflow
            workflow = {
                "prompt": {
                    # ComfyUI workflow structure would go here
                }
            }
            
            gen_response = await submit_video_generation(
                workflow=workflow,
                prompt=script
            )
            prompt_id = gen_response.get("prompt_id")
            redis_client.hset(f"job:{job_id}", "comfyui_prompt_id", prompt_id)
            redis_client.hset(f"job:{job_id}", "progress", "40")
            
            # Poll for completion
            max_attempts = 120  # 10 minutes max
            for attempt in range(max_attempts):
                await asyncio.sleep(5)  # Check every 5 seconds
                status = await get_video_generation_status(prompt_id)
                
                if status.get("status") == "completed":
                    output_videos = status.get("output_videos", [])
                    if output_videos:
                        redis_client.hset(f"job:{job_id}", "video_url", output_videos[0])
                    redis_client.hset(f"job:{job_id}", "progress", "70")
                    break
                elif status.get("status") == "failed":
                    raise Exception(f"Video generation failed: {status.get('error')}")
                
                # Update progress
                progress = status.get("progress", 40)
                redis_client.hset(f"job:{job_id}", "progress", str(progress))
            
        except Exception as e:
            raise Exception(f"Video generation failed: {str(e)}")
        
        # Stage 4: Audio Synthesis (if needed)
        try:
            # Generate voiceover for scenes
            audio_urls = []
            for scene in scene_plan.get("scenes", []):
                if scene.get("description"):
                    audio_result = await synthesize_speech(
                        text=scene["description"],
                        language="en",
                        emotion="neutral"
                    )
                    if audio_result.get("audio_url"):
                        audio_urls.append(audio_result["audio_url"])
            
            if audio_urls:
                redis_client.hset(f"job:{job_id}", "audio_urls", json.dumps(audio_urls))
                redis_client.hset(f"job:{job_id}", "progress", "85")
        except Exception as e:
            print(f"Audio synthesis warning: {str(e)}")
            # Don't fail the job if audio fails
        
        # Stage 5: Final Assembly
        # TODO: Combine video and audio using FFmpeg
        redis_client.hset(f"job:{job_id}", "current_stage", "assembly")
        redis_client.hset(f"job:{job_id}", "progress", "90")
        
        # Mark as completed
        redis_client.hset(f"job:{job_id}", "status", "completed")
        redis_client.hset(f"job:{job_id}", "progress", "100")
        redis_client.hset(f"job:{job_id}", "current_stage", "completed")
        redis_client.hset(f"job:{job_id}", "completed_at", datetime.utcnow().isoformat())
        
    except Exception as e:
        redis_client.hset(f"job:{job_id}", "status", "failed")
        redis_client.hset(f"job:{job_id}", "error", str(e))
        redis_client.hset(f"job:{job_id}", "completed_at", datetime.utcnow().isoformat())


# Import social media functions
from social_media import (
    Platform,
    get_platform_specs,
    validate_video_for_platform,
    get_export_instructions,
    export_to_platform,
    generate_platform_optimized_video
)


# Social media export endpoint
@app.post("/api/video/export")
async def export_video_to_social_media(
    job_id: str = Field(..., description="Video generation job ID"),
    platform: Platform = Field(..., description="Target platform"),
    access_token: str = Field(..., description="Platform API access token"),
    title: Optional[str] = Field(None, description="Post title"),
    description: Optional[str] = Field(None, description="Post description"),
    hashtags: Optional[List[str]] = Field(None, description="Hashtags"),
    user_id: str = None  # Should come from auth middleware
):
    """
    Export generated video to social media platform
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Get job data
    job_data = redis_client.hgetall(f"job:{job_id}")
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Verify user owns this job
    if job_data.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if job is completed
    if job_data.get("status") != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed. Current status: {job_data.get('status')}"
        )
    
    video_url = job_data.get("video_url")
    if not video_url:
        raise HTTPException(status_code=400, detail="No video URL found for this job")
    
    try:
        # Generate platform-optimized version
        optimized = generate_platform_optimized_video(video_url, platform)
        
        # Export to platform
        result = await export_to_platform(
            platform=platform,
            video_url=optimized["output_url"],
            access_token=access_token,
            title=title,
            description=description,
            hashtags=hashtags
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Export failed: {str(e)}"
        )


# Get platform specifications endpoint
@app.get("/api/platforms/{platform}/specs")
async def get_platform_specifications(platform: Platform):
    """Get specifications for a social media platform"""
    return get_platform_specs(platform)


# List all platforms endpoint
@app.get("/api/platforms")
async def list_platforms():
    """List all supported social media platforms"""
    return {
        "platforms": [
            {
                "id": p.value,
                "name": p.value.capitalize(),
                "specs": get_platform_specs(p)
            }
            for p in Platform
        ]
    }


# Service health check endpoint
@app.get("/api/services/health")
async def check_services_health():
    """Check health of all pipeline services"""
    health = await check_service_health()
    return {
        "services": health,
        "all_healthy": all(health.values())
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

