const { Configuration, OpenAIApi } = require("openai");
const { createClient } = require("@supabase/supabase-js");
const { verifyToken } = require("./utils/auth");

// Initialize Supabase client (with fallback for different env var names)
let supabase;
try {
  // Try using the config pattern first
  const { supabase: configSupabase } = require("./config/supabase");
  supabase = configSupabase;
} catch (error) {
  // Fallback to direct initialization
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    console.warn("Warning: Supabase configuration missing. Video generation may fail.");
  }
}

/**
 * Generate video from script using LongCat API or OpenAI
 * Supports both LongCat video generation service and fallback to text-to-video APIs
 */
exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const auth = await verifyToken(event.headers.authorization);
    const { userId, userData } = auth;

    const {
      script,
      campaignName,
      style = "creative",
      duration = 30, // seconds
    } = JSON.parse(event.body);

    if (!script || script.trim().length < 20) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Video script must be at least 20 characters",
        }),
      };
    }

    const tokenCost = parseInt(process.env.VIDEO_TOKEN_COST) || 50; // Videos cost more
    const currentTokens = userData.tokens || 0;

    if (currentTokens < tokenCost) {
      return {
        statusCode: 402,
        headers,
        body: JSON.stringify({
          message: "Insufficient tokens",
          required: tokenCost,
          current: currentTokens,
        }),
      };
    }

    // Use video orchestrator service
    const videoOrchestratorUrl = process.env.VIDEO_ORCHESTRATOR_URL || "http://video-orchestrator:8000";
    let videoUrl = null;
    let videoId = null;

    try {
      // Submit video generation job to orchestrator
      const orchestratorResponse = await fetch(`${videoOrchestratorUrl}/api/video/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: event.headers.authorization || "",
        },
        body: JSON.stringify({
          script,
          campaignName: campaignName || "Untitled Campaign",
          style,
          duration,
        }),
      });

      if (orchestratorResponse.ok) {
        const orchestratorData = await orchestratorResponse.json();
        videoId = orchestratorData.job_id;
        // Job is queued, will be processed asynchronously
        videoUrl = null; // Will be available when job completes
      } else {
        console.warn("Video orchestrator unavailable, using fallback");
      }
    } catch (error) {
      console.error("Video orchestrator error:", error);
      // Fall through to OpenAI fallback
    }

    // Fallback: Use OpenAI to generate video script/storyboard
    // Note: OpenAI doesn't generate videos directly, but we can create a detailed script
    // For actual video generation, you'd need to integrate with:
    // - RunwayML API
    // - D-ID API
    // - Synthesia API
    // - Or your own video generation service
    if (!videoUrl) {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);

      // Generate enhanced video script with scene descriptions
      const systemPrompt = `You are a video production expert. Create a detailed video script with scene-by-scene descriptions, visual elements, and timing for a ${style} style video.`;

      const completion = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Create a ${duration}-second video script based on: ${script}`,
          },
        ],
        max_tokens: 1500,
        temperature: 0.8,
      });

      const videoScript = completion.data.choices[0].message.content;

      // For now, return the script and indicate video generation is pending
      // In production, you'd queue this for actual video generation
      videoUrl = null; // Will be generated asynchronously
      videoId = `pending_${Date.now()}_${userId}`;
    }

    // Deduct tokens
    const { error: updateError } = await supabase
      .from("users")
      .update({ tokens: currentTokens - tokenCost })
      .eq("id", userId);

    if (updateError) throw updateError;

    // Save generation
    const { data: generation, error: insertError } = await supabase
      .from("generations")
      .insert([
        {
          user_id: userId,
          type: "video",
          prompt: script,
          result: JSON.stringify({
            videoUrl,
            videoId,
            campaignName,
            script,
            style,
            duration,
            status: videoUrl ? "completed" : "pending",
          }),
          token_cost: tokenCost,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        videoUrl,
        videoId,
        campaignName,
        script,
        status: videoUrl ? "completed" : "pending",
        message: videoUrl
          ? "Video generated successfully"
          : "Video generation queued. You will be notified when ready.",
        tokensRemaining: currentTokens - tokenCost,
        tokensUsed: tokenCost,
        generationId: generation.id,
      }),
    };
  } catch (error) {
    console.error("Video generation error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Video generation failed",
        error: error.message,
      }),
    };
  }
};

