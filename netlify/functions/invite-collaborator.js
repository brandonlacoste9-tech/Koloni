/**
 * Invite Collaborator
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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const auth = await verifyToken(event.headers.authorization);
    const { userId } = auth;

    const { email, role } = JSON.parse(event.body);

    if (!email || !role) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Email and role are required" }),
      };
    }

    // TODO: Send invitation email
    // TODO: Create invitation record in database
    // For now, just return success

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Invitation sent successfully"
      }),
    };
  } catch (error) {
    console.error("Error inviting collaborator:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Failed to send invitation"
      }),
    };
  }
};

