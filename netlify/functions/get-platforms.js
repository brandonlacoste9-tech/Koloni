/**
 * Get Supported Social Media Platforms
 */

const VIDEO_ORCHESTRATOR_URL = process.env.VIDEO_ORCHESTRATOR_URL || "http://video-orchestrator:8000";

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    // Call video orchestrator to get platforms
    const response = await fetch(`${VIDEO_ORCHESTRATOR_URL}/api/platforms`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch platforms");
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Error fetching platforms:", error);
    
    // Return fallback platforms if orchestrator is unavailable
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        platforms: [
          { id: "facebook", name: "Facebook", specs: {} },
          { id: "instagram", name: "Instagram", specs: {} },
          { id: "youtube", name: "YouTube", specs: {} },
          { id: "tiktok", name: "TikTok", specs: {} },
          { id: "twitter", name: "Twitter", specs: {} },
          { id: "linkedin", name: "LinkedIn", specs: {} },
        ],
      }),
    };
  }
};

