"""
ComfyUI API Wrapper Service
FastAPI wrapper around ComfyUI for video generation workflows
Integrates with HunyuanVideo and ComfyGPT
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import asyncio
import httpx
import uuid
from datetime import datetime
import json

app = FastAPI(title="Kolony ComfyUI API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
COMFYUI_URL = os.getenv("COMFYUI_URL", "http://localhost:8188")
COMFYUI_CLIENT_ID = str(uuid.uuid4())
WORKFLOW_TIMEOUT = int(os.getenv("WORKFLOW_TIMEOUT", "600"))  # 10 minutes default


# Pydantic Models
class WorkflowRequest(BaseModel):
    workflow: Dict[str, Any] = Field(..., description="ComfyUI workflow JSON")
    prompt: Optional[str] = Field(None, description="Text prompt for video generation")
    extra_data: Optional[Dict[str, Any]] = Field(default={}, description="Additional parameters")


class WorkflowResponse(BaseModel):
    prompt_id: str
    status: str
    message: Optional[str] = None


class JobStatusResponse(BaseModel):
    prompt_id: str
    status: str  # "pending", "running", "completed", "failed"
    progress: float = Field(ge=0, le=100)
    current_node: Optional[str] = None
    output_images: List[str] = []
    output_videos: List[str] = []
    error: Optional[str] = None
    estimated_time_remaining: Optional[int] = None


class QueueResponse(BaseModel):
    running: List[Dict[str, Any]]
    pending: List[Dict[str, Any]]


class HealthResponse(BaseModel):
    status: str
    comfyui_connected: bool
    comfyui_url: str
    client_id: str


# Global HTTP client
http_client = httpx.AsyncClient(timeout=300.0)
comfyui_connected = False


# Test ComfyUI connection
async def test_comfyui_connection():
    """Test if ComfyUI is accessible"""
    global comfyui_connected
    try:
        response = await http_client.get(f"{COMFYUI_URL}/")
        comfyui_connected = response.status_code == 200
        return comfyui_connected
    except Exception as e:
        print(f"ComfyUI connection test failed: {e}")
        comfyui_connected = False
        return False


@app.on_event("startup")
async def startup_event():
    """Test connection on startup"""
    await test_comfyui_connection()


@app.on_event("shutdown")
async def shutdown_event():
    """Close HTTP client on shutdown"""
    await http_client.aclose()


# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    connected = await test_comfyui_connection()
    return HealthResponse(
        status="healthy" if connected else "comfyui_unavailable",
        comfyui_connected=connected,
        comfyui_url=COMFYUI_URL,
        client_id=COMFYUI_CLIENT_ID
    )


# Submit workflow endpoint
@app.post("/api/workflow/submit", response_model=WorkflowResponse)
async def submit_workflow(request: WorkflowRequest):
    """
    Submit a ComfyUI workflow for execution
    
    The workflow should be a valid ComfyUI workflow JSON structure
    """
    if not comfyui_connected:
        raise HTTPException(
            status_code=503,
            detail="ComfyUI server is not available. Please check the connection."
        )
    
    try:
        # Validate workflow structure
        if "prompt" not in request.workflow:
            raise HTTPException(
                status_code=400,
                detail="Workflow must contain a 'prompt' field"
            )
        
        # Submit workflow to ComfyUI
        response = await http_client.post(
            f"{COMFYUI_URL}/prompt",
            json={
                "prompt": request.workflow["prompt"],
                "client_id": COMFYUI_CLIENT_ID,
                "extra_data": request.extra_data
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"ComfyUI error: {response.text}"
            )
        
        result = response.json()
        prompt_id = result.get("prompt_id")
        
        if not prompt_id:
            raise HTTPException(
                status_code=500,
                detail="ComfyUI did not return a prompt_id"
            )
        
        return WorkflowResponse(
            prompt_id=prompt_id,
            status="pending",
            message="Workflow submitted successfully"
        )
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to ComfyUI: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error submitting workflow: {str(e)}"
        )


# Get job status endpoint
@app.get("/api/workflow/status/{prompt_id}", response_model=JobStatusResponse)
async def get_workflow_status(prompt_id: str):
    """
    Get the status of a workflow execution
    """
    if not comfyui_connected:
        raise HTTPException(
            status_code=503,
            detail="ComfyUI server is not available"
        )
    
    try:
        # Get queue status
        queue_response = await http_client.get(f"{COMFYUI_URL}/queue")
        queue_data = queue_response.json()
        
        # Check if job is in queue
        running = queue_data.get("queue_running", [])
        pending = queue_data.get("queue_pending", [])
        
        # Check running jobs
        for job in running:
            if job[1] == prompt_id:
                return JobStatusResponse(
                    prompt_id=prompt_id,
                    status="running",
                    progress=50.0,  # ComfyUI doesn't provide exact progress
                    current_node=None
                )
        
        # Check pending jobs
        for job in pending:
            if job[1] == prompt_id:
                position = pending.index(job) + 1
                return JobStatusResponse(
                    prompt_id=prompt_id,
                    status="pending",
                    progress=0.0,
                    estimated_time_remaining=position * 60  # Rough estimate
                )
        
        # Check if job is completed (check history)
        history_response = await http_client.get(f"{COMFYUI_URL}/history/{prompt_id}")
        if history_response.status_code == 200:
            history_data = history_response.json()
            if prompt_id in history_data:
                # Job completed
                outputs = history_data[prompt_id].get("outputs", {})
                images = []
                videos = []
                
                # Extract output files
                for node_id, node_output in outputs.items():
                    if "images" in node_output:
                        for img in node_output["images"]:
                            images.append(f"{COMFYUI_URL}/view?filename={img['filename']}")
                    if "videos" in node_output:
                        for vid in node_output["videos"]:
                            videos.append(f"{COMFYUI_URL}/view?filename={vid['filename']}")
                
                return JobStatusResponse(
                    prompt_id=prompt_id,
                    status="completed",
                    progress=100.0,
                    output_images=images,
                    output_videos=videos
                )
        
        # Job not found
        raise HTTPException(
            status_code=404,
            detail=f"Workflow {prompt_id} not found"
        )
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to ComfyUI: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting workflow status: {str(e)}"
        )


# Get queue status endpoint
@app.get("/api/queue", response_model=QueueResponse)
async def get_queue_status():
    """
    Get current queue status
    """
    if not comfyui_connected:
        raise HTTPException(
            status_code=503,
            detail="ComfyUI server is not available"
        )
    
    try:
        response = await http_client.get(f"{COMFYUI_URL}/queue")
        queue_data = response.json()
        
        return QueueResponse(
            running=queue_data.get("queue_running", []),
            pending=queue_data.get("queue_pending", [])
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting queue status: {str(e)}"
        )


# Cancel workflow endpoint
@app.post("/api/workflow/cancel/{prompt_id}")
async def cancel_workflow(prompt_id: str):
    """
    Cancel a running or pending workflow
    """
    if not comfyui_connected:
        raise HTTPException(
            status_code=503,
            detail="ComfyUI server is not available"
        )
    
    try:
        response = await http_client.post(
            f"{COMFYUI_URL}/queue",
            json={
                "delete": [prompt_id]
            }
        )
        
        if response.status_code == 200:
            return {"message": f"Workflow {prompt_id} cancelled successfully"}
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to cancel workflow: {response.text}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error cancelling workflow: {str(e)}"
        )


# Get available models endpoint
@app.get("/api/models")
async def get_available_models():
    """
    Get list of available models in ComfyUI
    """
    if not comfyui_connected:
        raise HTTPException(
            status_code=503,
            detail="ComfyUI server is not available"
        )
    
    try:
        # Get object info to see available nodes/models
        response = await http_client.get(f"{COMFYUI_URL}/object_info")
        object_info = response.json()
        
        # Extract model information
        models = {
            "checkpoints": [],
            "loras": [],
            "vae": [],
            "upscalers": []
        }
        
        # Parse object info for model types
        # This is a simplified version - actual implementation would parse ComfyUI's object_info structure
        
        return {
            "models": models,
            "object_info": object_info  # Return full object info for reference
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting models: {str(e)}"
        )


# Generate workflow from ComfyGPT endpoint
@app.post("/api/workflow/generate")
async def generate_workflow_from_comfygpt(
    prompt: str = Field(..., description="Text description for video generation"),
    template_id: Optional[str] = Field(None, description="Workflow template ID"),
    parameters: Optional[Dict[str, Any]] = Field(default={}, description="Additional parameters")
):
    """
    Generate a ComfyUI workflow using ComfyGPT based on text prompt
    
    This endpoint would integrate with ComfyGPT service to generate workflows
    """
    # TODO: Integrate with ComfyGPT service
    # For now, return a placeholder workflow structure
    
    raise HTTPException(
        status_code=501,
        detail="ComfyGPT integration not yet implemented. Use /api/workflow/submit with a pre-defined workflow."
    )


# HunyuanVideo specific endpoint
@app.post("/api/video/generate")
async def generate_video_hunyuan(
    prompt: str = Field(..., description="Text prompt for video generation"),
    duration: int = Field(default=5, ge=1, le=10, description="Video duration in seconds"),
    resolution: str = Field(default="512x512", description="Video resolution"),
    style: Optional[str] = Field(None, description="Video style"),
    extra_params: Optional[Dict[str, Any]] = Field(default={})
):
    """
    Generate video using HunyuanVideo model via ComfyUI
    
    This creates a workflow specifically for HunyuanVideo generation
    """
    if not comfyui_connected:
        raise HTTPException(
            status_code=503,
            detail="ComfyUI server is not available"
        )
    
    # TODO: Construct HunyuanVideo workflow
    # This would create a ComfyUI workflow JSON that uses HunyuanVideo nodes
    
    # Placeholder workflow structure
    workflow = {
        "prompt": {
            # This would be a proper ComfyUI workflow structure
            # with HunyuanVideo nodes configured
        }
    }
    
    raise HTTPException(
        status_code=501,
        detail="HunyuanVideo workflow generation not yet implemented. Please use /api/workflow/submit with a pre-defined HunyuanVideo workflow."
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

