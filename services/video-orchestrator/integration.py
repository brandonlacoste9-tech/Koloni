"""
Integration module for video orchestrator
Handles communication with all pipeline services
"""

import httpx
import asyncio
from typing import Dict, Any, Optional, List
import os

# Service URLs
WHISPER_API_URL = os.getenv("WHISPER_API_URL", "http://whisper-api:8000")
CHATTERBOX_API_URL = os.getenv("CHATTERBOX_API_URL", "http://chatterbox-tts:8000")
COMFYUI_API_URL = os.getenv("COMFYUI_API_URL", "http://comfyui:8000")
LANGGRAPH_API_URL = os.getenv("LANGGRAPH_API_URL", "http://langgraph-orchestrator:8000")

# HTTP client with longer timeout for video generation
http_client = httpx.AsyncClient(timeout=600.0)


async def transcribe_audio(audio_file_path: str, language: Optional[str] = None) -> Dict[str, Any]:
    """Transcribe audio using Whisper API"""
    try:
        with open(audio_file_path, "rb") as f:
            files = {"file": f}
            data = {
                "language": language or "",
                "response_format": "json"
            }
            response = await http_client.post(
                f"{WHISPER_API_URL}/transcribe",
                files=files,
                data=data
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise Exception(f"Whisper transcription failed: {str(e)}")


async def synthesize_speech(
    text: str,
    voice_id: str = "default",
    language: str = "en",
    emotion: Optional[str] = None,
    speed: float = 1.0
) -> Dict[str, Any]:
    """Synthesize speech using Chatterbox TTS"""
    try:
        response = await http_client.post(
            f"{CHATTERBOX_API_URL}/synthesize",
            json={
                "text": text,
                "voice_id": voice_id,
                "language": language,
                "emotion": emotion,
                "speed": speed,
                "format": "mp3"
            }
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise Exception(f"TTS synthesis failed: {str(e)}")


async def plan_scenes(
    script: str,
    duration_seconds: int,
    style_preferences: Optional[Dict[str, Any]] = None,
    brand_guidelines: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Plan scenes using LangGraph orchestrator"""
    try:
        response = await http_client.post(
            f"{LANGGRAPH_API_URL}/api/plan/scenes",
            json={
                "script": script,
                "duration_seconds": duration_seconds,
                "style_preferences": style_preferences or {},
                "brand_guidelines": brand_guidelines or {}
            }
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise Exception(f"Scene planning failed: {str(e)}")


async def plan_workflow(
    scenes: List[Dict[str, Any]],
    video_type: str = "hunyuan",
    editing_requirements: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Plan workflow using LangGraph orchestrator"""
    try:
        response = await http_client.post(
            f"{LANGGRAPH_API_URL}/api/plan/workflow",
            json={
                "scenes": scenes,
                "video_type": video_type,
                "editing_requirements": editing_requirements or []
            }
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise Exception(f"Workflow planning failed: {str(e)}")


async def submit_video_generation(
    workflow: Dict[str, Any],
    prompt: Optional[str] = None,
    extra_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Submit video generation job to ComfyUI"""
    try:
        response = await http_client.post(
            f"{COMFYUI_API_URL}/api/workflow/submit",
            json={
                "workflow": workflow,
                "prompt": prompt,
                "extra_data": extra_data or {}
            }
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise Exception(f"Video generation submission failed: {str(e)}")


async def get_video_generation_status(prompt_id: str) -> Dict[str, Any]:
    """Get status of video generation job"""
    try:
        response = await http_client.get(
            f"{COMFYUI_API_URL}/api/workflow/status/{prompt_id}"
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise Exception(f"Failed to get video status: {str(e)}")


async def check_service_health() -> Dict[str, bool]:
    """Check health of all services"""
    services = {
        "whisper": WHISPER_API_URL,
        "chatterbox": CHATTERBOX_API_URL,
        "comfyui": COMFYUI_API_URL,
        "langgraph": LANGGRAPH_API_URL
    }
    
    health_status = {}
    
    for service_name, service_url in services.items():
        try:
            response = await http_client.get(f"{service_url}/health", timeout=5.0)
            health_status[service_name] = response.status_code == 200
        except:
            health_status[service_name] = False
    
    return health_status

