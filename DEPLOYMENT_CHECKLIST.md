# Koloni Creator Studio - Deployment Checklist

This document provides step-by-step instructions for deploying the Koloni Creator Studio to Netlify.

## Prerequisites

- [ ] A Netlify account (sign up at https://netlify.com)
- [ ] An OpenAI account with API access (https://platform.openai.com)
- [ ] A Stripe account for payments (https://stripe.com)
- [ ] Node.js installed locally (for testing)
- [ ] Git repository connected to GitHub

## 1. Environment Setup

### 1.1 Create Environment Variables File

```bash
# Copy the example environment file
cp .env.example .env
```

### 1.2 Configure OpenAI

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `.env`:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

### 1.3 Configure Stripe

1. Go to https://dashboard.stripe.com/apikeys
2. Get your Secret Key (use test key for testing)
3. Get your Publishable Key
4. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_your-actual-key-here
   STRIPE_PUBLISHABLE_KEY=pk_test_your-actual-key-here
   ```

### 1.4 Configure Stripe Webhooks

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret
6. Add to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your-actual-secret-here
   ```

## 2. Local Testing

### 2.1 Install Dependencies

```bash
npm install netlify-cli -g
npm install
```

### 2.2 Install Required Packages

The following packages are needed for the serverless functions:

```bash
npm install node-fetch stripe
```

### 2.3 Test Build

```bash
node build.js
```

Verify that `public/` directory is created with all files.

### 2.4 Test Functions Locally

```bash
# Start Netlify dev server
netlify dev

# Visit http://localhost:8888/create.html
# Test generation and export functionality
```

### 2.5 Verify All Features

- [ ] Token balance displays correctly
- [ ] LongCat generation works
- [ ] Emu generation works
- [ ] Instagram export formats correctly
- [ ] YouTube export formats correctly
- [ ] History saves and displays
- [ ] Copy to clipboard works

## 3. Netlify Configuration

### 3.1 Create netlify.toml (if not exists)

Create a `netlify.toml` file in the root directory:

```toml
[build]
  command = "node build.js"
  publish = "public"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3.2 Connect Repository to Netlify

1. Log in to Netlify
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider (GitHub)
4. Select your repository
5. Configure build settings:
   - **Build command**: `node build.js`
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`

### 3.3 Add Environment Variables to Netlify

1. Go to Site settings → Environment variables
2. Add all variables from `.env`:
   - `OPENAI_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `URL` (use your Netlify URL: https://your-site.netlify.app)

**Important**: Use the "Sensitive variable" option for all keys!

## 4. Deploy

### 4.1 Manual Deploy

```bash
netlify deploy --prod
```

### 4.2 Automatic Deploy (Git Push)

```bash
git add .
git commit -m "Deploy Koloni Creator Studio"
git push origin main
```

Netlify will automatically build and deploy on push.

### 4.3 Verify Deployment

1. Visit your Netlify site URL
2. Navigate to `/create.html`
3. Test all features:
   - [ ] Token balance loads
   - [ ] AI generation works
   - [ ] Export functionality works
   - [ ] No console errors

## 5. Post-Deployment

### 5.1 Update Stripe Webhook URL

If you used a placeholder URL during setup:
1. Go to Stripe Dashboard → Webhooks
2. Edit your webhook endpoint
3. Update URL to: `https://your-actual-site.netlify.app/.netlify/functions/stripe-webhook`

### 5.2 Test Payments (Optional)

Use Stripe test cards to verify payment flow:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

### 5.3 Monitor Function Logs

1. Go to Netlify Dashboard → Functions
2. Click on each function to view logs
3. Monitor for errors or issues

### 5.4 Set Up Production Keys

When ready for production:
1. Replace all test Stripe keys with live keys
2. Use production OpenAI API key
3. Update environment variables in Netlify

## 6. Maintenance

### 6.1 Regular Checks

- [ ] Monitor Netlify function logs weekly
- [ ] Check OpenAI API usage and costs
- [ ] Review Stripe payments and webhooks
- [ ] Update dependencies monthly

### 6.2 Database Migration (Recommended)

The current token-manager uses in-memory storage. For production:

1. Choose a database:
   - FaunaDB (recommended for Netlify)
   - Supabase
   - Firebase
   - PostgreSQL

2. Update `netlify/functions/token-manager.js` to use database
3. Add database credentials to environment variables

### 6.3 Security Best Practices

- [ ] Never commit `.env` file
- [ ] Rotate API keys every 90 days
- [ ] Use webhook signature verification (already implemented)
- [ ] Enable CORS only for your domain
- [ ] Monitor for unusual API usage

## 7. Troubleshooting

### Function Errors

**Error**: "Module not found: node-fetch"
- **Solution**: Run `npm install node-fetch` and redeploy

**Error**: "OpenAI API key invalid"
- **Solution**: Verify `OPENAI_API_KEY` in Netlify environment variables

**Error**: "Stripe webhook signature failed"
- **Solution**: Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard

### UI Issues

**Token balance shows "--"**
- **Solution**: Check browser console for errors, verify token-manager function works

**Content not generating**
- **Solution**: Check function logs, verify OpenAI API key and credits

### Build Errors

**Error**: "public directory not found"
- **Solution**: Ensure `build.js` runs successfully, check build logs

## 8. Success Criteria

Deployment is successful when:

- [ ] Site loads at Netlify URL
- [ ] Creator Studio accessible at `/create.html`
- [ ] Token balance displays correctly
- [ ] AI generation creates content
- [ ] Export features work for Instagram and YouTube
- [ ] History saves and persists
- [ ] No errors in browser console
- [ ] No errors in Netlify function logs
- [ ] Stripe webhooks receive and process events

## 9. Next Steps

After successful deployment:

1. **Add Authentication**: Implement user login/signup
2. **Upgrade Storage**: Replace in-memory token storage with database
3. **Add Analytics**: Track usage and user behavior
4. **Implement Payment Flow**: Create Stripe checkout for token purchases
5. **Add More AI Formats**: Expand beyond LongCat and Emu
6. **Optimize Performance**: Add caching and CDN optimization

## Support

If you encounter issues:
1. Check Netlify function logs
2. Review browser console for errors
3. Verify all environment variables are set
4. Test functions locally with `netlify dev`
5. Check Stripe webhook delivery logs

---

**Last Updated**: November 2025
**Version**: 1.0.0
