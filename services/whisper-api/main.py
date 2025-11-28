"""
Whisper Turbo API Service
FastAPI service for speech-to-text conversion using Whisper Large V3 Turbo
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import tempfile
import asyncio
from datetime import datetime

# Try to import whisper - will fail if not installed, that's okay for now
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    print("Warning: Whisper not installed. Install with: pip install openai-whisper")

app = FastAPI(title="Kolony Whisper API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variable
whisper_model = None
MODEL_SIZE = os.getenv("MODEL_SIZE", "large-v3-turbo")
DEVICE = os.getenv("DEVICE", "cuda")


# Pydantic Models
class TranscriptionRequest(BaseModel):
    language: Optional[str] = None
    task: str = "transcribe"  # "transcribe" or "translate"
    response_format: str = "json"  # "json", "text", "srt", "verbose_json", "vtt"
    temperature: float = 0.0
    timestamp_granularities: Optional[List[str]] = ["word", "segment"]


class TranscriptionResponse(BaseModel):
    text: str
    language: Optional[str] = None
    duration: Optional[float] = None
    segments: Optional[List[Dict[str, Any]]] = None
    words: Optional[List[Dict[str, Any]]] = None


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_size: str
    device: str


# Initialize Whisper model
def load_whisper_model():
    """Load Whisper model on startup"""
    global whisper_model
    
    if not WHISPER_AVAILABLE:
        print("Whisper not available - install openai-whisper")
        return
    
    try:
        print(f"Loading Whisper model: {MODEL_SIZE} on {DEVICE}...")
        whisper_model = whisper.load_model(MODEL_SIZE, device=DEVICE)
        print(f"Whisper model loaded successfully!")
    except Exception as e:
        print(f"Error loading Whisper model: {e}")
        whisper_model = None


@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    # Run in thread pool to avoid blocking
    await asyncio.to_thread(load_whisper_model)


# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if whisper_model is not None else "model_not_loaded",
        model_loaded=whisper_model is not None,
        model_size=MODEL_SIZE,
        device=DEVICE
    )


# Transcription endpoint
@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    task: str = Form("transcribe"),
    response_format: str = Form("json"),
    temperature: float = Form(0.0),
):
    """
    Transcribe audio file to text using Whisper Turbo
    
    Supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
    """
    if not whisper_model:
        raise HTTPException(
            status_code=503,
            detail="Whisper model not loaded. Please check service logs."
        )
    
    # Validate file type
    allowed_extensions = [".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        try:
            # Write uploaded file to temp file
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
            
            # Transcribe using Whisper
            print(f"Transcribing file: {file.filename}")
            
            # Run transcription in thread pool (CPU-bound operation)
            result = await asyncio.to_thread(
                whisper_model.transcribe,
                tmp_file_path,
                language=language if language else None,
                task=task,
                temperature=temperature,
                word_timestamps=True,
                verbose=False
            )
            
            # Extract information
            text = result["text"].strip()
            detected_language = result.get("language")
            duration = None
            segments = []
            words = []
            
            # Process segments if available
            if "segments" in result:
                for seg in result["segments"]:
                    segment_data = {
                        "id": seg.get("id"),
                        "start": seg.get("start"),
                        "end": seg.get("end"),
                        "text": seg.get("text", "").strip()
                    }
                    segments.append(segment_data)
                
                # Calculate duration from segments
                if segments:
                    duration = segments[-1]["end"]
            
            # Process words if available
            if "words" in result:
                for word_info in result["words"]:
                    word_data = {
                        "word": word_info.get("word"),
                        "start": word_info.get("start"),
                        "end": word_info.get("end"),
                        "probability": word_info.get("probability")
                    }
                    words.append(word_data)
            
            # Format response based on requested format
            if response_format == "text":
                return {"text": text}
            elif response_format == "srt":
                # Generate SRT format
                srt_content = ""
                for i, seg in enumerate(segments, 1):
                    start_time = format_timestamp(seg["start"])
                    end_time = format_timestamp(seg["end"])
                    srt_content += f"{i}\n{start_time} --> {end_time}\n{seg['text']}\n\n"
                return {"text": srt_content}
            elif response_format == "vtt":
                # Generate VTT format
                vtt_content = "WEBVTT\n\n"
                for seg in segments:
                    start_time = format_timestamp_vtt(seg["start"])
                    end_time = format_timestamp_vtt(seg["end"])
                    vtt_content += f"{start_time} --> {end_time}\n{seg['text']}\n\n"
                return {"text": vtt_content}
            else:
                # Default: JSON format
                return TranscriptionResponse(
                    text=text,
                    language=detected_language,
                    duration=duration,
                    segments=segments if segments else None,
                    words=words if words else None
                )
        
        finally:
            # Clean up temp file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)


def format_timestamp(seconds: float) -> str:
    """Format timestamp for SRT format (HH:MM:SS,mmm)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def format_timestamp_vtt(seconds: float) -> str:
    """Format timestamp for VTT format (HH:MM:SS.mmm)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


# Batch transcription endpoint (for processing multiple files)
@app.post("/transcribe/batch")
async def transcribe_batch(
    files: List[UploadFile] = File(...),
    language: Optional[str] = Form(None),
    task: str = Form("transcribe")
):
    """
    Transcribe multiple audio files in batch
    """
    if not whisper_model:
        raise HTTPException(
            status_code=503,
            detail="Whisper model not loaded"
        )
    
    results = []
    
    for file in files:
        try:
            # Create a temporary file for each upload
            file_ext = os.path.splitext(file.filename)[1].lower()
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
                content = await file.read()
                tmp_file.write(content)
                tmp_file_path = tmp_file.name
                
                try:
                    # Transcribe
                    result = await asyncio.to_thread(
                        whisper_model.transcribe,
                        tmp_file_path,
                        language=language if language else None,
                        task=task,
                        word_timestamps=True
                    )
                    
                    results.append({
                        "filename": file.filename,
                        "text": result["text"].strip(),
                        "language": result.get("language"),
                        "duration": result.get("segments", [{}])[-1].get("end") if result.get("segments") else None
                    })
                finally:
                    if os.path.exists(tmp_file_path):
                        os.unlink(tmp_file_path)
        
        except Exception as e:
            results.append({
                "filename": file.filename,
                "error": str(e)
            })
    
    return {"results": results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

