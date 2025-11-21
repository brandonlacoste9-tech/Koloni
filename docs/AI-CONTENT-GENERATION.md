# 🤖 AI Content Generation API

Koloni's AI-powered content generation system supports 4 content types with enterprise-grade security and credit management.

---

## 📋 Content Types

### 1. 🐱 **LongCat** - Long-Form Content
- **Description:** In-depth articles and comprehensive content
- **Length:** 1000-2000 words
- **Credit Cost:** 5 credits
- **Best For:** Blog posts, guides, white papers, detailed articles

### 2. 🦅 **Emu** - Short-Form Content  
- **Description:** Concise, engaging social media content
- **Length:** 100-300 words
- **Credit Cost:** 1 credit
- **Best For:** Social posts, quick updates, captions

### 3. 📢 **Ad Copy**
- **Description:** Compelling advertising copy
- **Length:** 50-150 words
- **Credit Cost:** 2 credits
- **Best For:** Advertisements, promotional content, CTAs

### 4. 📝 **Blog Post**
- **Description:** Well-structured blog articles
- **Length:** 500-1500 words
- **Credit Cost:** 4 credits
- **Best For:** Company blogs, thought leadership, tutorials

---

## 🚀 API Endpoints

### **POST** `/netlify/functions/generate-content`

Generate AI content with specified type and options.

#### Request Headers:
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

#### Request Body:
```json
{
  "type": "longcat|emu|ad|blog",
  "prompt": "Your content prompt here (10-2000 characters)",
  "options": {
    "tone": "professional|casual|friendly|formal|persuasive|creative",
    "keywords": ["keyword1", "keyword2"],
    "targetAudience": "your target audience",
    "platform": "twitter|linkedin|facebook|instagram",
    "cta": "Your call-to-action",
    "includeHashtags": true,
    "includeIntro": true,
    "includeConclusion": true
  }
}
```

#### Response (Success):
```json
{
  "success": true,
  "content": "Generated content here...",
  "metadata": {
    "type": "LongCat",
    "tokensUsed": 1500,
    "processingTime": 3500,
    "model": "gpt-4-turbo-preview",
    "creditCost": 5,
    "creditsRemaining": 5,
    "creditsUsed": 5
  }
}
```

#### Response (Insufficient Credits):
```json
{
  "error": "Insufficient credits",
  "message": "You need 5 credits but only have 2",
  "required": 5,
  "available": 2
}
```

---

### **GET** `/netlify/functions/get-generations`

Retrieve user's generation history.

#### Request Headers:
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Query Parameters:
- `limit` (optional): Results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `type` (optional): Filter by content type

#### Response:
```json
{
  "success": true,
  "generations": [
    {
      "id": "uuid",
      "type": "longcat",
      "prompt": "Original prompt",
      "content": "Generated content",
      "credits_used": 5,
      "created_at": "2025-11-20T23:15:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 45,
    "hasMore": true
  },
  "user": {
    "credits": 15,
    "totalGenerations": 45,
    "subscriptionTier": "free"
  }
}
```

---

### **GET** `/netlify/functions/get-content-types`

Get available content types and pricing.

#### Response:
```json
{
  "success": true,
  "contentTypes": [
    {
      "id": "longcat",
      "name": "LongCat",
      "description": "Long-form content (1000-2000 words)",
      "creditCost": 5
    },
    ...
  ]
}
```

---

## 💳 Credit System

### Free Tier
- **Initial Credits:** 10
- **Allows:** 2 LongCat OR 10 Emu posts OR 5 Ads OR mix

### Pro Tier (Coming Soon)
- **Credits:** Unlimited
- **Price:** $29/month

### Enterprise Tier (Coming Soon)
- **Credits:** Unlimited
- **Features:** Priority support, custom models, API access
- **Price:** Custom

---

## 🎨 Example Use Cases

### Example 1: Generate LongCat Content
```javascript
const response = await fetch('/netlify/functions/generate-content', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'longcat',
    prompt: 'Write a comprehensive guide about sustainable living practices',
    options: {
      tone: 'friendly',
      keywords: ['sustainability', 'eco-friendly', 'green living'],
      targetAudience: 'environmentally conscious millennials'
    }
  })
});

const data = await response.json();
console.log(data.content);
```

### Example 2: Generate Social Media Post (Emu)
```javascript
const response = await fetch('/netlify/functions/generate-content', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'emu',
    prompt: 'Promote our new productivity app launch',
    options: {
      tone: 'casual',
      platform: 'twitter',
      includeHashtags: true
    }
  })
});
```

### Example 3: Generate Ad Copy
```javascript
const response = await fetch('/netlify/functions/generate-content', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'ad',
    prompt: 'Luxury skincare product for women 30-45',
    options: {
      tone: 'persuasive',
      platform: 'instagram',
      cta: 'Shop Now',
      targetAudience: 'affluent women 30-45'
    }
  })
});
```

---

## 🔒 Security Features

✅ **Rate Limiting:** 20 generations per 15 minutes per IP  
✅ **Input Validation:** Joi schemas for all requests  
✅ **Authentication:** JWT token required  
✅ **Authorization:** Users can only access own data  
✅ **XSS Protection:** All inputs sanitized  
✅ **Security Headers:** CSP, HSTS, X-Frame-Options  

---

## 📊 Database Schema

Run the SQL in `database/schema.sql` in your Supabase SQL Editor to set up:

- **users** table - User credits and subscription info
- **generations** table - Content generation history
- **credit_transactions** table - Credit purchase/usage tracking
- **Row Level Security (RLS)** - Automatic data isolation
- **Auto-triggers** - User creation and timestamp updates

---

## 🛠️ Setup Instructions

1. **Run Database Schema:**
   ```sql
   -- Copy contents of database/schema.sql
   -- Paste into Supabase SQL Editor
   -- Execute
   ```

2. **Environment Variables (Already Set):**
   - ✅ `OPENAI_API_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `NEXT_PUBLIC_SUPABASE_DATABASE_URL`

3. **Deploy:**
   ```bash
   npm install
   netlify deploy --prod
   ```

---

## 📈 Monitoring

### View Generation Stats:
```sql
SELECT 
  type,
  COUNT(*) as total_generations,
  SUM(credits_used) as total_credits,
  AVG(processing_time) as avg_time_ms
FROM generations
GROUP BY type;
```

### Check User Credits:
```sql
SELECT 
  email,
  credits,
  total_generations,
  subscription_tier
FROM users
ORDER BY total_generations DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Error: "Insufficient credits"
**Solution:** User needs to purchase more credits or upgrade subscription

### Error: "Rate limit exceeded"
**Solution:** Wait 15 minutes or contact support for limit increase

### Error: "Invalid authentication token"
**Solution:** Token expired or invalid, user needs to re-authenticate

---

**Documentation Updated:** November 20, 2025  
**Version:** 1.0.0
