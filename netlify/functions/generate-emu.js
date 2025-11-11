/**
 * Netlify Function: Generate Emu AI Content
 * Handles AI-powered content generation for Emu format
 */

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { prompt, tone, length, userId } = JSON.parse(event.body);

    // Validate required parameters
    if (!prompt || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters: prompt, userId' })
      };
    }

    // Check user token balance (integrate with token-manager)
    const tokenCheckResponse = await fetch(
      `${process.env.URL}/.netlify/functions/token-manager`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', userId, cost: 15 })
      }
    );

    const tokenCheck = await tokenCheckResponse.json();
    if (!tokenCheck.sufficient) {
      return {
        statusCode: 402,
        body: JSON.stringify({ error: 'Insufficient tokens', balance: tokenCheck.balance })
      };
    }

    // Call OpenAI or other AI provider
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a creative AI assistant specializing in generating engaging Emu format content. Emu content is concise, impactful, and optimized for quick consumption.'
          },
          {
            role: 'user',
            content: `Create an Emu content piece with the following parameters:\nPrompt: ${prompt}\nTone: ${tone || 'engaging'}\nLength: ${length || 'short'}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0].message.content;

    // Deduct tokens after successful generation
    await fetch(
      `${process.env.URL}/.netlify/functions/token-manager`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deduct', userId, cost: 15 })
      }
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        content: generatedContent,
        metadata: {
          format: 'emu',
          tone: tone || 'engaging',
          length: length || 'short',
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Error in generate-emu:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate content', details: error.message })
    };
  }
};
