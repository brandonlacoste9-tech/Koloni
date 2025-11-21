# Security Quick Start Guide

## ⏱️ 5-Minute Setup

### 1. Generate Secure Secrets

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT Refresh Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Set Environment Variables

**Local Development:**
```bash
cp .env.example .env
# Edit .env with your values
```

**Netlify Production:**
```bash
netlify env:set JWT_SECRET "your-secret-here"
netlify env:set SUPABASE_SERVICE_KEY "your-key-here"
```

### 3. Use Security Middleware

```javascript
const {
  checkRateLimit,
  validateRequest,
  schemas,
  createSecureResponse,
  getClientIP
} = require('./utils/security');

exports.handler = async (event) => {
  // Rate limiting
  const ip = getClientIP(event);
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return createSecureResponse(429, { error: 'Too many requests' });
  }

  // Input validation
  const body = JSON.parse(event.body || '{}');
  const validation = validateRequest(body, schemas.login);
  if (!validation.valid) {
    return createSecureResponse(400, { errors: validation.errors });
  }

  // Your logic here
  return createSecureResponse(200, { success: true });
};
```

## 📝 Common Patterns

### Pattern 1: User Registration

```javascript
const { validateRequest, schemas } = require('./utils/security');

const validation = validateRequest(userData, schemas.register);
// Enforces: email format, 8+ char password with uppercase, number, special char
```

### Pattern 2: Content Generation

```javascript
const validation = validateRequest(data, schemas.generateContent);
// Enforces: prompt length, valid type, tone options
```

### Pattern 3: Payment Processing

```javascript
const validation = validateRequest(paymentData, schemas.createPayment);
// Enforces: positive amount, valid currency, max limits
```

## ⚡ Quick Commands

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# View outdated packages
npm outdated

# Update all dependencies (carefully)
npm update
```

## 🚨 Security Checklist for Each Function

- [ ] Rate limiting implemented
- [ ] Input validation added
- [ ] Authentication verified
- [ ] Authorization checked
- [ ] Error messages sanitized
- [ ] Logs don't contain sensitive data
- [ ] CORS headers configured
- [ ] Security headers added

## 🔗 Quick Links

- [Full Security Documentation](../SECURITY.md)
- [Security Middleware Code](../netlify/functions/utils/security.js)
- [Environment Variables](./.env.example)

## 🐛 Common Issues

### Issue: "Too many requests" error
**Solution:** Rate limit hit. Wait 15 minutes or adjust limits in security.js

### Issue: Validation fails
**Solution:** Check schema requirements in `security.js` schemas object

### Issue: CORS errors
**Solution:** Add your origin to `CORS_ALLOWED_ORIGINS` in .env

---

**Need Help?** Check [SECURITY.md](../SECURITY.md) for detailed documentation.
