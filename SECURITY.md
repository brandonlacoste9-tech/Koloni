# Security Policy

## 🔒 Security Overview

Koloni Creator Studio implements enterprise-grade security measures to protect user data, API keys, and sensitive information.

## 🚨 CRITICAL: Exposed Secrets Found

**ACTION REQUIRED IMMEDIATELY:**

Your previous `.env.example` file contained real API keys and secrets that were committed to the repository. This is a critical security vulnerability.

### Required Actions (Do These NOW):

1. **Rotate ALL Exposed Secrets:**
   - [ ] Generate new Supabase service role key
   - [ ] Generate new JWT secrets
   - [ ] Generate new Stripe keys (if using)
   - [ ] Regenerate any other exposed credentials

2. **Supabase Security:**
   ```bash
   # Go to: https://app.supabase.com/project/mddjewxdsijhhekjddty/settings/api
   # Click "Refresh" next to Service Role Key
   # Update your production environment variables
   ```

3. **Generate New JWT Secrets:**
   ```bash
   node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
   node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
   ```

4. **Update Environment Variables:**
   - Update Netlify environment variables with new secrets
   - Never use the exposed secrets again

## 🛡️ Security Features Implemented

### 1. Input Validation
- Joi schema validation for all API endpoints
- XSS protection through input sanitization
- SQL injection prevention via parameterized queries

### 2. Rate Limiting
- 100 requests per 15 minutes per IP
- Protects against brute force attacks
- Configurable limits per endpoint

### 3. Security Headers
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- X-XSS-Protection

### 4. Authentication & Authorization
- bcryptjs password hashing (12 rounds)
- JWT-based authentication
- Refresh token rotation
- Session management via Supabase

### 5. CORS Configuration
- Whitelist-based origin validation
- Credential support for authenticated requests
- Preflight request handling

## 📝 Using Security Utilities

### Example: Secure Function with Rate Limiting

```javascript
const {
  checkRateLimit,
  validateRequest,
  schemas,
  createSecureResponse,
  getClientIP
} = require('./utils/security');

exports.handler = async (event) => {
  // 1. Check rate limit
  const clientIP = getClientIP(event);
  const rateLimit = checkRateLimit(clientIP, 50, 15 * 60 * 1000);
  
  if (!rateLimit.allowed) {
    return createSecureResponse(429, {
      error: 'Too many requests',
      resetIn: rateLimit.resetTime
    });
  }
  
  // 2. Validate input
  const body = JSON.parse(event.body || '{}');
  const validation = validateRequest(body, schemas.generateContent);
  
  if (!validation.valid) {
    return createSecureResponse(400, {
      error: 'Validation failed',
      details: validation.errors
    });
  }
  
  // 3. Process request with validated data
  try {
    const result = await processRequest(validation.data);
    return createSecureResponse(200, result);
  } catch (error) {
    // Never expose internal errors
    return createSecureResponse(500, {
      error: 'Internal server error'
    });
  }
};
```

## 🔐 Environment Variables Security

### Setup

1. **Local Development:**
   ```bash
   cp .env.example .env
   # Fill in your actual values
   ```

2. **Production (Netlify):**
   ```bash
   netlify env:set JWT_SECRET "your-secret-here"
   netlify env:set SUPABASE_SERVICE_KEY "your-key-here"
   ```

3. **Verify .gitignore:**
   ```bash
   # Ensure these are in .gitignore:
   .env
   .env.local
   .env.*.local
   .env.production
   ```

## 🚀 Deployment Security Checklist

- [ ] All environment variables set in Netlify
- [ ] `.env` files never committed
- [ ] Strong JWT secrets generated (256-bit minimum)
- [ ] Supabase RLS (Row Level Security) policies configured
- [ ] Stripe webhook signature verification enabled
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] API error messages sanitized (no stack traces)

## 🔍 Security Monitoring

### Recommended Tools

1. **npm audit:** Run regularly
   ```bash
   npm audit
   npm audit fix
   ```

2. **Dependabot:** Enable on GitHub for automated dependency updates

3. **Supabase Logs:** Monitor for suspicious activity
   - Failed login attempts
   - Unusual API usage patterns
   - Database query anomalies

4. **Stripe Webhooks:** Verify all webhook signatures

## 🐛 Reporting Security Vulnerabilities

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email: security@koloni.com (or your security contact)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Netlify Security](https://docs.netlify.com/security/secure-access-to-sites/)
- [Supabase Security](https://supabase.com/docs/guides/auth/managing-user-data)
- [Stripe Security](https://stripe.com/docs/security/guide)

## 🔄 Security Update Schedule

- **Weekly:** Review npm audit
- **Monthly:** Review and update dependencies
- **Quarterly:** Rotate JWT secrets
- **Annually:** Full security audit

## 📝 Recent Security Updates

### 2025-11-20
- ✅ Added rate limiting middleware
- ✅ Implemented Joi validation schemas
- ✅ Added security headers
- ✅ Removed exposed secrets from .env.example
- ✅ Created security documentation
- ⚠️ **ACTION REQUIRED:** Rotate all exposed credentials

---

**Last Updated:** November 20, 2025  
**Next Review:** December 20, 2025
