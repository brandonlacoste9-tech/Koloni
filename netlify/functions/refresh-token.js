const jwt = require("jsonwebtoken");
const { supabase } = require("./config/supabase");

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
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
    const { refreshToken } = JSON.parse(event.body);

    if (!refreshToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Refresh token required" }),
      };
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    );

    if (decoded.type !== "refresh") {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "Invalid token type" }),
      };
    }

    // Verify refresh token exists
    const { data: tokenRecord, error: tokenError } = await supabase
      .from("refresh_tokens")
      .select("*")
      .eq("user_id", decoded.id)
      .eq("token", refreshToken)
      .single();

    if (tokenError || !tokenRecord) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "Invalid refresh token" }),
      };
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", decoded.id)
      .single();

    if (userError || !user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: decoded.id, email: user.email, type: "access" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ accessToken }),
    };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ message: "Invalid or expired refresh token" }),
    };
  }
};
