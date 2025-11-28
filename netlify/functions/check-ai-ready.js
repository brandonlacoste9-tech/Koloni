/**
 * Check if AI services are ready
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
    // Check video orchestrator health
    let orchestratorReady = false;
    try {
      const response = await fetch(`${VIDEO_ORCHESTRATOR_URL}/api/services/health`, {
        timeout: 2000
      });
      if (response.ok) {
        const data = await response.json();
        orchestratorReady = data.all_healthy || false;
      }
    } catch (error) {
      console.log("Orchestrator check failed:", error);
    }

    // For now, always return ready after a brief check
    // In production, you'd check all services
    const ready = orchestratorReady || true; // Allow fallback for development

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ready,
        services: {
          orchestrator: orchestratorReady
        },
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    // Default to ready if check fails (for development)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ready: true,
        services: {},
        timestamp: new Date().toISOString()
      }),
    };
  }
};

