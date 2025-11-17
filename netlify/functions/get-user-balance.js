const { supabase } = require("./config/supabase");
const { verifyToken } = require("./utils/auth");

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

    const { data: user, error } = await supabase
      .from("users")
      .select("tokens, name, email")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        tokens: user.tokens || 0,
        name: user.name,
        email: user.email,
      }),
    };
  } catch (error) {
    console.error("Error fetching balance:", error);
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ message: "Authentication failed" }),
    };
  }
};
