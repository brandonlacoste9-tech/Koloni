# Chatterbox TTS Service

FastAPI service for text-to-speech synthesis using Chatterbox TTS.

## Features

- **High Quality**: Outperforms ElevenLabs with 63.75% user preference in blind tests
- **MIT Licensed**: Open-source with permissive licensing
- **22 Languages**: Supports 22 languages with native-quality voices
- **Emotion Control**: Adjustable emotion profiles (neutral, happy, sad, angry, excited, calm)
- **Neural Watermarking**: Built-in watermarking for content protection
- **OpenAI-Compatible API**: Drop-in replacement for OpenAI TTS API
- **500K Hours Training**: Trained on 500K hours of cleaned audio data

## API Endpoints

### POST `/synthesize`
Synthesize speech from text.

**Request Body:**
```json
{
  "text": "Hello, this is a test of the text-to-speech system.",
  "voice_id": "default",
  "language": "en",
  "emotion": "neutral",
  "speed": 1.0,
  "pitch": 1.0,
  "format": "mp3",
  "sample_rate": 24000
}
```

**Response:**
```json
{
  "audio_url": "/audio/generated_audio.mp3",
  "duration": 3.5,
  "text": "Hello, this is a test...",
  "voice_used": "default",
  "language": "en",
  "format": "mp3"
}
```

### POST `/synthesize/stream`
Stream synthesized audio (for real-time playback).

### POST `/synthesize/batch`
Synthesize multiple texts in batch.

**Query Parameters:**
- `texts`: List of texts (comma-separated or JSON array)
- `voice_id`: Voice to use
- `language`: Language code
- `emotion`: Emotion profile

### GET `/voices`
List all available voices.

**Query Parameters:**
- `language` (optional): Filter by language code

**Response:**
```json
[
  {
    "id": "default",
    "name": "Default English",
    "language": "en",
    "gender": "neutral",
    "emotion_profile": {
      "neutral": 1.0,
      "happy": 0.8,
      "calm": 0.9
    }
  }
]
```

### GET `/voices/{voice_id}`
Get details about a specific voice.

### POST `/v1/audio/speech` (OpenAI-Compatible)
OpenAI-compatible endpoint for easy integration.

**Query Parameters:**
- `model`: "chatterbox-tts" (required but ignored)
- `input`: Text to synthesize (required)
- `voice`: Voice ID (default: "default")
- `response_format`: "mp3", "wav", "ogg" (default: "mp3")
- `speed`: Speed multiplier 0.25-4.0 (default: 1.0)

**Response:** Audio file (binary)

### GET `/health`
Health check endpoint.

## Supported Languages

English (en), Spanish (es), French (fr), German (de), Italian (it), Portuguese (pt), Russian (ru), Japanese (ja), Chinese (zh), Korean (ko), Arabic (ar), Hindi (hi), Dutch (nl), Polish (pl), Turkish (tr), Swedish (sv), Danish (da), Norwegian (no), Finnish (fi), Czech (cs), Hungarian (hu), Romanian (ro)

## Emotion Profiles

- `neutral`: Balanced, professional tone
- `happy`: Upbeat, cheerful tone
- `sad`: Melancholic, subdued tone
- `angry`: Intense, forceful tone
- `excited`: Energetic, enthusiastic tone
- `calm`: Relaxed, soothing tone

## Development

### Local Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Install system dependencies
# On Ubuntu/Debian:
sudo apt-get install ffmpeg libsndfile1

# On macOS:
brew install ffmpeg libsndfile

# Run the service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Using Docker

```bash
# Build image
docker build -t chatterbox-tts .

# Run container
docker run -p 8000:8000 \
  -e MODEL_PATH=/models/chatterbox \
  -v /path/to/models:/models \
  chatterbox-tts
```

### Environment Variables

- `MODEL_PATH`: Path to Chatterbox TTS model files (default: "/models/chatterbox")
- `API_KEY`: API key if using remote Chatterbox service (optional)

## Integration with Video Pipeline

The service integrates with the video generation pipeline:

1. **Scene Planning**: After scenes are planned, text is extracted for narration
2. **Voice Synthesis**: Text is converted to speech with appropriate voice and emotion
3. **Timestamp Sync**: Audio timestamps are synchronized with video scenes
4. **Final Assembly**: Audio is combined with video in final rendering

## Performance

- **Latency**: ~100-200ms per word (depending on model size)
- **Quality**: Studio-quality output with natural prosody
- **Concurrent Requests**: Supports multiple simultaneous synthesis requests
- **Batch Processing**: Optimized for batch synthesis of multiple texts

## Notes

- First request may be slower as model loads
- GPU recommended for best performance (but works on CPU)
- Voice library can be extended via database integration
- Neural watermarking is applied automatically to all outputs

## OpenAI Compatibility

This service provides an OpenAI-compatible endpoint, making it a drop-in replacement:

```python
# Instead of:
# response = openai.audio.speech.create(...)

# Use:
response = requests.post(
    "http://chatterbox-tts:8000/v1/audio/speech",
    params={
        "input": "Your text here",
        "voice": "default",
        "model": "chatterbox-tts"
    }
)
```

