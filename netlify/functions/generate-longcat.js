const { Configuration, OpenAIApi } = require("openai");
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
      prompt,
      style = "creative",
      tone = "professional",
    } = JSON.parse(event.body);

    if (!prompt || prompt.trim().length < 10) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Prompt must be at least 10 characters",
        }),
      };
    }

    const tokenCost = parseInt(process.env.LONGCAT_TOKEN_COST) || 10;
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

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const systemPrompt = `You are a ${style} content creator. Generate engaging, vertical-scroll optimized content in a ${tone} tone.`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    const generatedContent = completion.data.choices[0].message.content;

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
          type: "longcat",
          prompt,
          style,
          tone,
          result: generatedContent,
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
        content: generatedContent,
        generationId: generation.id,
        tokensRemaining: currentTokens - tokenCost,
        tokensUsed: tokenCost,
      }),
    };
  } catch (error) {
    console.error("Generation error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Content generation failed" }),
    };
  }
};
