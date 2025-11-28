/**
 * AI Suggestions Endpoint
 * Provides real-time creative suggestions and improvements
 */

const { Configuration, OpenAIApi } = require("openai");
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
    const { text, type } = JSON.parse(event.body);

    if (!text || text.length < 10) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ suggestions: [] }),
      };
    }

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    // Generate suggestions based on content
    const prompt = `Analyze this ${type} and provide 3-5 actionable suggestions to improve it for video content creation. Focus on:
1. Engagement and clarity
2. Call-to-action opportunities
3. Visual storytelling elements
4. Platform optimization
5. Audience appeal

Text: "${text}"

Return suggestions as JSON array with: {type: "improve|add|optimize|warning|tip", message: "...", action: "add_hashtags|improve_text|add_call_to_action", value: "..."}`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a creative video content expert. Provide concise, actionable suggestions in JSON format.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    let suggestions = [];
    try {
      const responseText = completion.data.choices[0].message.content;
      // Try to parse JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create suggestions from text
        suggestions = [
          {
            type: "tip",
            message: "Consider adding a clear call-to-action at the end",
            action: "add_call_to_action",
            value: "Try it today!",
          },
        ];
      }
    } catch (parseError) {
      console.error("Error parsing suggestions:", parseError);
      suggestions = [];
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        suggestions: suggestions.slice(0, 5), // Limit to 5 suggestions
      }),
    };
  } catch (error) {
    console.error("AI suggestions error:", error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ suggestions: [] }),
    };
  }
};

