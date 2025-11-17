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

    const params = event.queryStringParameters || {};
    const limit = parseInt(params.limit) || 20;
    const offset = parseInt(params.offset) || 0;
    const type = params.type;

    let query = supabase
      .from("generations")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq("type", type);
    }

    const { data: generations, error, count } = await query;

    if (error) throw error;

    const formattedGenerations = generations.map((gen) => ({
      id: gen.id,
      type: gen.type,
      prompt: gen.prompt,
      result: gen.result,
      style: gen.style,
      tone: gen.tone,
      tokenCost: gen.token_cost,
      createdAt: gen.created_at,
      preview: gen.result.substring(0, 150) + "...",
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        generations: formattedGenerations,
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count,
      }),
    };
  } catch (error) {
    console.error("Error fetching generations:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Failed to fetch generations" }),
    };
  }
};
