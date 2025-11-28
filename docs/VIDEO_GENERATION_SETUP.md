# Video Generation Setup Guide

## Overview

The video generation feature has been implemented but requires additional configuration to work fully. This document outlines what's been implemented and what still needs to be configured.

## ✅ What's Been Implemented

1. **Netlify Function**: `netlify/functions/generate-video.js`
   - Handles video generation requests
   - Supports LongCat video service integration
   - Includes OpenAI fallback for script generation
   - Token management and user authentication

2. **Frontend Integration**: 
   - Video form handler in `src/js/creator.js`
   - Video player UI in `src/creator.html`
   - Download and share functionality

3. **AI Router**: 
   - Added `generateVideo()` method to `src/js/ai-router.js`
   - Integrated with existing routing system

## 🔧 Required Configuration

### 1. Environment Variables

Add these to your Netlify environment variables or `.env` file:

```bash
# LongCat Video Service (Optional but recommended)
LONGCAT_VIDEO_ENDPOINT=https://your-longcat-service.com/api/generate
LONGCAT_API_KEY=your_longcat_api_key_here

# Video generation token cost
VIDEO_TOKEN_COST=50

# Supabase Configuration (if not already set)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here
```

### 2. Video Generation Service Options

You have several options for actual video generation:

#### Option A: LongCat Service (Recommended)
If you have a LongCat video generation service:
- Set `LONGCAT_VIDEO_ENDPOINT` to your service URL
- Set `LONGCAT_API_KEY` for authentication
- The service should accept POST requests with:
  ```json
  {
    "script": "video script text",
    "campaignName": "Campaign name",
    "style": "creative",
    "duration": 30,
    "userId": "user_id"
  }
  ```
- And return:
  ```json
  {
    "videoUrl": "https://...",
    "videoId": "unique_id"
  }
  ```

#### Option B: Third-Party Video APIs
Integrate with services like:
- **RunwayML API**: For AI video generation
- **D-ID API**: For talking head videos
- **Synthesia API**: For avatar-based videos
- **Pika Labs API**: For text-to-video generation

To integrate, modify `generate-video.js` to call your chosen service.

#### Option C: Custom Video Generation Service
Build your own service that:
1. Accepts video script and parameters
2. Generates video using your preferred method
3. Returns video URL when complete
4. Optionally supports webhooks for async processing

### 3. Database Schema

Ensure your `generations` table supports video type:

```sql
-- The generations table should already support this, but verify:
-- type: text (should accept 'video')
-- result: text/jsonb (stores video metadata)
```

### 4. Video Status Polling (Optional)

For async video generation, implement a status check endpoint:

```javascript
// netlify/functions/get-video-status.js
exports.handler = async (event) => {
  const { videoId } = JSON.parse(event.body);
  
  // Check video generation status
  // Return: { status: 'pending'|'completed'|'failed', videoUrl: '...' }
};
```

Then update the polling function in `creator.js` to call this endpoint.

## 🚀 Testing

1. **Test with OpenAI fallback**:
   - Don't set `LONGCAT_VIDEO_ENDPOINT`
   - Submit a video generation request
   - Should receive a "pending" status with script generation

2. **Test with LongCat service**:
   - Set `LONGCAT_VIDEO_ENDPOINT` and `LONGCAT_API_KEY`
   - Submit a video generation request
   - Should receive video URL if service is working

3. **Test token deduction**:
   - Check user tokens before generation
   - Generate video
   - Verify tokens reduced by `VIDEO_TOKEN_COST`

## 📝 Next Steps

1. **Choose your video generation service**
2. **Set up environment variables**
3. **Test the integration**
4. **Implement status polling** (if using async generation)
5. **Add error handling** for service failures
6. **Add video preview/thumbnail** generation
7. **Implement video editing** features

## 🔍 Troubleshooting

### Video generation returns "pending" status
- Check if `LONGCAT_VIDEO_ENDPOINT` is set
- Verify the endpoint is accessible
- Check service logs for errors

### "Insufficient tokens" error
- Verify user has enough tokens (default cost: 50)
- Check `VIDEO_TOKEN_COST` environment variable
- Verify token deduction logic

### Video player doesn't load
- Check video URL format
- Verify CORS settings on video hosting
- Check browser console for errors

### LongCat service errors
- Verify API key is correct
- Check service endpoint URL
- Review service documentation for required parameters

## 📚 Additional Resources

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**Last Updated**: 2025-01-XX
**Status**: Implementation complete, configuration required

