/**
 * Create Stripe Checkout Session
 * Handles embedded checkout for AdGenXAI credit purchases
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Get user info from authorization header
 */
async function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Main handler
 */
exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    // Parse request body
    const { plan, price, credits } = JSON.parse(event.body);
    
    // Validate required fields
    if (!plan || !price || !credits) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: plan, price, credits' })
      };
    }
    
    // Get user info if authenticated
    const user = await getUserFromToken(event.headers.authorization);
    
    // Prepare session parameters
    const sessionParams = {
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${credits} AdGenXAI Credits`,
            description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - Monthly subscription`,
            images: ['https://adgenxai.pro/logo.png'],
          },
          unit_amount: price,
          recurring: {
            interval: 'month',
            interval_count: 1
          }
        },
        quantity: 1,
      }],
      mode: 'subscription',
      ui_mode: 'embedded',
      return_url: `${process.env.URL || event.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        plan,
        credits: credits.toString(),
        user_id: user?.id || 'guest'
      }
    };
    
    // Add customer email if user is authenticated
    if (user?.email) {
      sessionParams.customer_email = user.email;
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);
    
    // Return client secret for embedded checkout
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        clientSecret: session.client_secret,
        sessionId: session.id
      })
    };
    
  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to create checkout session',
        message: error.message 
      })
    };
  }
};
