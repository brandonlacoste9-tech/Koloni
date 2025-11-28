/**
 * Export Video to Social Media Platform
 * Handles exporting generated videos to various social media platforms
 */

const { createClient } = require("@supabase/supabase-js");
const { verifyToken } = require("./utils/auth");

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Warning: Supabase configuration missing.");
}

const supabase = createClient(supabaseUrl || "", supabaseKey || "");

// Video orchestrator URL
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
      job_id,
      platform,
      access_token,
      title,
      description,
      hashtags,
    } = JSON.parse(event.body);

    if (!job_id || !platform || !access_token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Missing required fields: job_id, platform, access_token",
        }),
      };
    }

    // Call video orchestrator export endpoint
    const exportResponse = await fetch(
      `${VIDEO_ORCHESTRATOR_URL}/api/video/export`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: event.headers.authorization || "",
        },
        body: JSON.stringify({
          job_id,
          platform,
          access_token,
          title,
          description,
          hashtags,
        }),
      }
    );

    if (!exportResponse.ok) {
      const errorData = await exportResponse.json();
      throw new Error(errorData.detail || "Export failed");
    }

    const exportData = await exportResponse.json();

    // Save export record to database
    const { error: insertError } = await supabase
      .from("video_exports")
      .insert([
        {
          user_id: userId,
          job_id,
          platform,
          post_id: exportData.post_id,
          post_url: exportData.url,
          status: exportData.success ? "completed" : "failed",
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      console.error("Error saving export record:", insertError);
      // Continue anyway
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        platform,
        post_id: exportData.post_id,
        post_url: exportData.url,
        message: exportData.message || "Video exported successfully",
      }),
    };
  } catch (error) {
    console.error("Export error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Export failed",
        error: error.message,
      }),
    };
  }
};

