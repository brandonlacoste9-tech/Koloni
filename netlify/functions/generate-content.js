/**
 * Content Generation API Endpoint
 * Handles all AI content generation requests with security and credit management
 */

const {
  checkRateLimit,
  validateRequest,
  schemas,
  createSecureResponse,
  getClientIP,
  getCorsHeaders
} = require('./utils/security');

const {
  generateLongCat,
  generateEmu,
  generateAdCopy,
  generateBlogPost,
  validateGenerationRequest,
  getAllContentTypes
} = require('./utils/openai');

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Content Generation Schema (extends base schema)
 */
const Joi = require('joi');

const generateContentSchema = Joi.object({
  type: Joi.string().valid('longcat', 'emu', 'ad', 'blog').required(),
  prompt: Joi.string().min(10).max(2000).required(),
  options: Joi.object({
    tone: Joi.string().valid('professional', 'casual', 'friendly', 'formal', 'persuasive', 'creative').optional(),
    keywords: Joi.array().items(Joi.string()).max(10).optional(),
    targetAudience: Joi.string().max(100).optional(),
    platform: Joi.string().max(50).optional(),
    cta: Joi.string().max(100).optional(),
    includeHashtags: Joi.boolean().optional(),
    includeIntro: Joi.boolean().optional(),
    includeConclusion: Joi.boolean().optional()
  }).optional()
});

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin)
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return createSecureResponse(405, { error: 'Method not allowed' });
  }

  try {
    const clientIP = getClientIP(event);
    
    // Rate limiting: 20 generations per 15 minutes
    const rateLimit = checkRateLimit(`generate:${clientIP}`, 20, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return createSecureResponse(429, {
        error: 'Rate limit exceeded',
        message: 'Too many generation requests. Please try again later.',
        resetIn: rateLimit.resetTime
      });
    }

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validation = validateRequest(body, generateContentSchema);
    
    if (!validation.valid) {
      return createSecureResponse(400, {
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { type, prompt, options = {} } = validation.data;

    // Additional validation
    const contentValidation = validateGenerationRequest(type, prompt);
    if (!contentValidation.valid) {
      return createSecureResponse(400, {
        error: contentValidation.error
      });
    }

    // Get user from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createSecureResponse(401, {
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify user and get credits
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return createSecureResponse(401, {
        error: 'Invalid authentication token'
      });
    }

    // Check user credits
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits, total_generations')
      .eq('id', user.id)
      .single();

    if (userError) {
      // User might not exist in users table yet, create them
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          credits: 10, // Free tier: 10 credits
          total_generations: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return createSecureResponse(500, {
          error: 'Failed to initialize user account'
        });
      }
    }

    const currentCredits = userData?.credits || 10;
    const { creditCost } = require('./utils/openai').CONTENT_TYPES[type];

    // Check if user has enough credits
    if (currentCredits < creditCost) {
      return createSecureResponse(402, {
        error: 'Insufficient credits',
        message: `You need ${creditCost} credits but only have ${currentCredits}`,
        required: creditCost,
        available: currentCredits
      });
    }

    // Generate content based on type
    let result;
    switch (type) {
      case 'longcat':
        result = await generateLongCat(prompt, options);
        break;
      case 'emu':
        result = await generateEmu(prompt, options);
        break;
      case 'ad':
        result = await generateAdCopy(prompt, options);
        break;
      case 'blog':
        result = await generateBlogPost(prompt, options);
        break;
      default:
        return createSecureResponse(400, { error: 'Invalid content type' });
    }

    if (!result.success) {
      return createSecureResponse(500, {
        error: 'Content generation failed',
        message: result.error
      });
    }

    // Deduct credits and update user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        credits: currentCredits - creditCost,
        total_generations: (userData?.total_generations || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user credits:', updateError);
      // Continue anyway - content was generated
    }

    // Save generation to history
    const { error: historyError } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        type,
        prompt,
        content: result.content,
        options,
        tokens_used: result.metadata.tokensUsed,
        credits_used: creditCost,
        processing_time: result.metadata.processingTime,
        model: result.metadata.model
      });

    if (historyError) {
      console.error('Error saving generation history:', historyError);
      // Continue anyway - content was generated
    }

    // Return successful response
    return createSecureResponse(200, {
      success: true,
      content: result.content,
      metadata: {
        ...result.metadata,
        creditsRemaining: currentCredits - creditCost,
        creditsUsed: creditCost
      }
    }, getCorsHeaders(event.headers.origin));

  } catch (error) {
    console.error('Content generation error:', error);
    
    return createSecureResponse(500, {
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
};
