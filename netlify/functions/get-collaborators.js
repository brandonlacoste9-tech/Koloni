/**
 * Get Collaborators for a Campaign/Project
 */

const { createClient } = require("@supabase/supabase-js");
const { verifyToken } = require("./utils/auth");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl || "", supabaseKey || "");

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
    const auth = await verifyToken(event.headers.authorization);
    const { userId } = auth;

    // Get collaborators (mock data for now)
    // In production, this would query a collaborators table
    const collaborators = [
      {
        id: '1',
        name: 'You',
        email: 'user@example.com',
        role: 'Owner',
        isOnline: true,
        avatar: null,
        currentActivity: 'Editing campaign'
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        collaborators
      }),
    };
  } catch (error) {
    console.error("Error getting collaborators:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        collaborators: [],
        error: "Failed to load collaborators"
      }),
    };
  }
};

