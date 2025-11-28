# Whisper API Service

FastAPI service for speech-to-text conversion using OpenAI Whisper Large V3 Turbo.

## Features

- **Fast Transcription**: Uses Whisper Large V3 Turbo (5.4x faster than V3 Large)
- **Multiple Formats**: Supports JSON, text, SRT, VTT output formats
- **Word Timestamps**: Provides word-level timestamps for precise alignment
- **Batch Processing**: Can transcribe multiple files at once
- **Language Detection**: Automatic language detection or specify language
- **Translation**: Can translate audio to English

## API Endpoints

### POST `/transcribe`
Transcribe a single audio file.

**Request:**
- `file`: Audio file (mp3, mp4, mpeg, mpga, m4a, wav, webm)
- `language` (optional): Language code (e.g., "en", "es", "fr")
- `task` (optional): "transcribe" or "translate" (default: "transcribe")
- `response_format` (optional): "json", "text", "srt", "vtt" (default: "json")
- `temperature` (optional): Sampling temperature (default: 0.0)

**Response:**
```json
{
  "text": "Transcribed text here...",
  "language": "en",
  "duration": 30.5,
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 5.2,
      "text": "First segment text"
    }
  ],
  "words": [
    {
      "word": "Hello",
      "start": 0.0,
      "end": 0.5,
      "probability": 0.99
    }
  ]
}
```

### POST `/transcribe/batch`
Transcribe multiple audio files.

**Request:**
- `files`: List of audio files
- `language` (optional): Language code
- `task` (optional): "transcribe" or "translate"

**Response:**
```json
{
  "results": [
    {
      "filename": "audio1.mp3",
      "text": "Transcribed text...",
      "language": "en",
      "duration": 30.5
    }
  ]
}
```

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_size": "large-v3-turbo",
  "device": "cuda"
}
```

## Development

### Local Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Install FFmpeg (required for audio processing)
# On Ubuntu/Debian:
sudo apt-get install ffmpeg

# On macOS:
brew install ffmpeg

# On Windows:
# Download from https://ffmpeg.org/download.html

# Run the service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Using Docker

```bash
# Build image
docker build -t whisper-api .

# Run container (requires NVIDIA GPU)
docker run --gpus all -p 8000:8000 \
  -e MODEL_SIZE=large-v3-turbo \
  -e DEVICE=cuda \
  whisper-api
```

### Environment Variables

- `MODEL_SIZE`: Whisper model size (default: "large-v3-turbo")
  - Options: "tiny", "base", "small", "medium", "large", "large-v2", "large-v3", "large-v3-turbo"
- `DEVICE`: Device to use (default: "cuda")
  - Options: "cuda", "cpu"

## Model Sizes

| Model | Parameters | VRAM | Speed |
|-------|-----------|------|-------|
| tiny | 39M | ~1GB | Fastest |
| base | 74M | ~1GB | Fast |
| small | 244M | ~2GB | Medium |
| medium | 769M | ~5GB | Slow |
| large | 1550M | ~10GB | Slower |
| large-v3-turbo | 1550M | ~10GB | Fast (optimized) |

**Recommended**: Use `large-v3-turbo` for best balance of speed and accuracy.

## Performance

- **Speed**: ~130x real-time with batched processing
- **Accuracy**: State-of-the-art multilingual transcription
- **Latency**: First result in 1-2 seconds for short audio

## Notes

- First request will be slower as the model loads
- GPU is recommended for best performance
- Model is downloaded automatically on first run (~3GB for large-v3-turbo)
- Supports 99+ languages

