/**
 * Get User Generations API Endpoint
 * Retrieves generation history for authenticated users
 */

const {
  createSecureResponse,
  getCorsHeaders
} = require('./utils/security');

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin)
    };
  }

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return createSecureResponse(405, { error: 'Method not allowed' });
  }

  try {
    // Get user from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createSecureResponse(401, {
        error: 'Authentication required'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return createSecureResponse(401, {
        error: 'Invalid authentication token'
      });
    }

    // Parse query parameters
    const params = event.queryStringParameters || {};
    const limit = parseInt(params.limit) || 20;
    const offset = parseInt(params.offset) || 0;
    const type = params.type; // Optional filter by type

    // Build query
    let query = supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply type filter if provided
    if (type && ['longcat', 'emu', 'ad', 'blog'].includes(type)) {
      query = query.eq('type', type);
    }

    const { data: generations, error: queryError, count } = await query;

    if (queryError) {
      console.error('Query error:', queryError);
      return createSecureResponse(500, {
        error: 'Failed to retrieve generations'
      });
    }

    // Get user credits
    const { data: userData } = await supabase
      .from('users')
      .select('credits, total_generations, subscription_tier')
      .eq('id', user.id)
      .single();

    return createSecureResponse(200, {
      success: true,
      generations,
      pagination: {
        limit,
        offset,
        total: count,
        hasMore: offset + limit < count
      },
      user: {
        credits: userData?.credits || 0,
        totalGenerations: userData?.total_generations || 0,
        subscriptionTier: userData?.subscription_tier || 'free'
      }
    }, getCorsHeaders(event.headers.origin));

  } catch (error) {
    console.error('Get generations error:', error);
    
    return createSecureResponse(500, {
      error: 'Internal server error'
    });
  }
};
