/**
 * OAuth Authentication Callback
 * Handles Google and GitHub OAuth flows
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    const body = JSON.parse(event.body);
    
    // Initiate OAuth flow
    if (body.provider) {
      const { provider } = body;
      
      if (!['google', 'github'].includes(provider)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid provider' })
        };
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${process.env.URL || event.headers.origin}/auth.html`,
          scopes: provider === 'google' ? 'email profile' : 'user:email'
        }
      });
      
      if (error) {
        console.error('OAuth initiation error:', error);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: error.message })
        };
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          url: data.url
        })
      };
    }
    
    // Handle OAuth callback
    if (body.code && body.state) {
      const { code } = body;
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('OAuth callback error:', error);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: error.message })
        };
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          success: true,
          token: data.session?.access_token,
          user: data.user
        })
      };
    }
    
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request parameters' })
    };
    
  } catch (error) {
    console.error('OAuth handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'OAuth authentication failed',
        message: error.message 
      })
    };
  }
};
