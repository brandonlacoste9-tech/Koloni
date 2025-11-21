/**
 * Security Utilities for Netlify Functions
 * Provides rate limiting, input validation, and security headers
 */

const Joi = require('joi');

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitStore = new Map();

/**
 * Rate Limiter
 * @param {string} identifier - User IP or user ID
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 */
function checkRateLimit(identifier, maxRequests = 100, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const userRequests = rateLimitStore.get(identifier) || [];
  
  // Filter requests within the time window
  const recentRequests = userRequests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return {
      allowed: false,
      resetTime: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
    };
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitStore.set(identifier, recentRequests);
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    cleanupRateLimitStore(windowMs);
  }
  
  return { allowed: true, remaining: maxRequests - recentRequests.length };
}

function cleanupRateLimitStore(windowMs) {
  const now = Date.now();
  for (const [key, requests] of rateLimitStore.entries()) {
    const recent = requests.filter(time => now - time < windowMs);
    if (recent.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, recent);
    }
  }
}

/**
 * Security Headers
 */
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://*.supabase.co;",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

/**
 * CORS Headers
 */
function getCorsHeaders(origin) {
  const allowedOrigins = [
    'http://localhost:8888',
    'http://localhost:3000',
    process.env.SITE_URL
  ].filter(Boolean);
  
  const isAllowed = allowedOrigins.includes(origin) || 
                   (origin && origin.endsWith('.netlify.app'));
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * Validation Schemas
 */
const schemas = {
  // User registration
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }),
    name: Joi.string().min(2).max(100).required()
  }),
  
  // User login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  // Content generation
  generateContent: Joi.object({
    prompt: Joi.string().min(10).max(2000).required(),
    type: Joi.string().valid('ad', 'post', 'article', 'email').required(),
    tone: Joi.string().valid('professional', 'casual', 'friendly', 'formal').optional(),
    length: Joi.string().valid('short', 'medium', 'long').optional()
  }),
  
  // Payment
  createPayment: Joi.object({
    amount: Joi.number().positive().max(1000000).required(),
    currency: Joi.string().length(3).uppercase().required(),
    description: Joi.string().max(500).optional()
  })
};

/**
 * Validate Request Body
 */
function validateRequest(data, schema) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      valid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  }
  
  return { valid: true, data: value };
}

/**
 * Sanitize User Input (prevent XSS)
 */
function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  return input;
}

/**
 * Extract Client IP
 */
function getClientIP(event) {
  return event.headers['x-forwarded-for']?.split(',')[0].trim() ||
         event.headers['x-real-ip'] ||
         'unknown';
}

/**
 * Security Response Helper
 */
function createSecureResponse(statusCode, body, additionalHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...securityHeaders,
      ...additionalHeaders
    },
    body: JSON.stringify(body)
  };
}

module.exports = {
  checkRateLimit,
  securityHeaders,
  getCorsHeaders,
  schemas,
  validateRequest,
  sanitizeInput,
  getClientIP,
  createSecureResponse
};
