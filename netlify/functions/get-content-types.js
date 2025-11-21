/**
 * Get Content Types API Endpoint
 * Returns available content types and their details
 */

const {
  createSecureResponse,
  getCorsHeaders
} = require('./utils/security');

const { getAllContentTypes } = require('./utils/openai');

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
    const contentTypes = getAllContentTypes();

    return createSecureResponse(200, {
      success: true,
      contentTypes
    }, getCorsHeaders(event.headers.origin));

  } catch (error) {
    console.error('Get content types error:', error);
    
    return createSecureResponse(500, {
      error: 'Internal server error'
    });
  }
};
