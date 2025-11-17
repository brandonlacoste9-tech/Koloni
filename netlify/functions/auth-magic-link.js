/**
 * Magic Link Authentication
 * Sends passwordless authentication link via email
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
    const { email } = JSON.parse(event.body);
    
    // Validate email
    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Valid email address is required' })
      };
    }
    
    // Send magic link using Supabase Auth
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.URL || event.headers.origin}/dashboard`,
        shouldCreateUser: true,
      }
    });
    
    if (error) {
      console.error('Magic link error:', error);
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
        message: 'Check your email for the magic link!' 
      })
    };
    
  } catch (error) {
    console.error('Magic link handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to send magic link',
        message: error.message 
      })
    };
  }
};
