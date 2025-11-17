/**
 * Phone Authentication
 * Sends OTP via SMS and verifies code
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
    const { phone, otp, verify } = JSON.parse(event.body);
    
    // Validate phone number
    if (!phone) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Phone number is required' })
      };
    }
    
    if (verify) {
      // Verify OTP
      if (!otp) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'OTP code is required' })
        };
      }
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
      });
      
      if (error) {
        console.error('OTP verification error:', error);
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
      
    } else {
      // Send OTP
      const { data, error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: true
        }
      });
      
      if (error) {
        console.error('Phone OTP error:', error);
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
          message: 'OTP sent to your phone!' 
        })
      };
    }
    
  } catch (error) {
    console.error('Phone auth handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Phone authentication failed',
        message: error.message 
      })
    };
  }
};
