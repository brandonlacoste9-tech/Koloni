# 🐝 Koloni Development Best Practices

> Building the hive, one hexagon at a time

**Welcome to the Koloni colony!** This document establishes our development standards for the AI-powered beekeeping platform. Like a well-organized hive, our codebase follows clear patterns and structures.

## 🍯 Table of Contents

1. [JavaScript Standards - The Queen's Code](#1-javascript-standards---the-queens-code)
2. [Netlify Functions Architecture - The Worker Bees](#2-netlify-functions-architecture---the-worker-bees)
3. [AI Integration - The Hive Mind](#3-ai-integration---the-hive-mind)
4. [Security Best Practices - Protecting the Hive](#4-security-best-practices---protecting-the-hive)
5. [CSS Architecture - The Honeycomb Structure](#5-css-architecture---the-honeycomb-structure)
6. [Testing Strategy - Quality Control](#6-testing-strategy---quality-control)
7. [Accessibility Standards - Welcoming All Beekeepers](#7-accessibility-standards---welcoming-all-beekeepers)
8. [Performance Optimization - Efficient Foraging](#8-performance-optimization---efficient-foraging)
9. [Deployment & DevOps - Maintaining the Colony](#9-deployment--devops---maintaining-the-colony)

---

## 1. JavaScript Standards - The Queen's Code

> The queen bee sets the standard - our JavaScript must be clean, consistent, and reliable.

### ES6+ Syntax - Modern Beekeeping Tools

**Use `const` by default, `let` when reassignment is needed:**

```javascript
// ✅ Good - constants for the colony
const HIVE_NAME = 'Koloni';
const MAX_WORKERS = 100;

// ✅ Good - let for changing values
let activeWorkers = 0;
activeWorkers += 1;

// ❌ Avoid - var is old hive technology
var oldStyleVar = 'outdated';
```

### Arrow Functions - Swift as a Bee's Flight

**Prefer arrow functions for callbacks and concise operations:**

```javascript
// ✅ Good - clean arrow function
const processHoney = (amount) => amount * 1.5;

// ✅ Good - array operations
const workers = ['bee1', 'bee2', 'bee3'];
workers.map(worker => worker.toUpperCase());

// ✅ Good - event handlers
document.getElementById('hive-button').addEventListener('click', () => {
    console.log('Hive activated!');
});

// ❌ Avoid - unnecessary function keyword for simple operations
const processHoney = function(amount) {
    return amount * 1.5;
};
```

### Template Literals - Building the Honeycomb

**Use template literals for string composition:**

```javascript
// ✅ Good - readable string interpolation
const workerName = 'BuzzBee';
const message = `Welcome to the hive, ${workerName}!`;
const multiLine = `
    Colony Status:
    - Workers: ${activeWorkers}
    - Honey Production: ${honeyAmount}kg
`;

// ❌ Avoid - string concatenation
const message = 'Welcome to the hive, ' + workerName + '!';
```

### Destructuring - Efficient Honey Extraction

**Extract values cleanly from objects and arrays:**

```javascript
// ✅ Good - object destructuring
const { title, content, style } = generatedContent;

// ✅ Good - array destructuring
const [firstWorker, secondWorker, ...restWorkers] = workersList;

// ✅ Good - function parameters
function formatForExport({ platform, content, metadata }) {
    return `${platform}: ${content}`;
}

// ❌ Avoid - manual property access
const title = generatedContent.title;
const content = generatedContent.content;
const style = generatedContent.style;
```

### Async/Await - Synchronized Bee Dance

**Handle asynchronous operations with async/await:**

```javascript
// ✅ Good - clean async/await
async function generateContent(prompt) {
    try {
        const response = await fetch('/.netlify/functions/generate-longcat', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Hive communication error:', error);
        throw error;
    }
}

// ✅ Good - parallel operations
async function gatherAllHoney() {
    const [source1, source2, source3] = await Promise.all([
        fetchFromHive1(),
        fetchFromHive2(),
        fetchFromHive3()
    ]);
}

// ❌ Avoid - promise chains when async/await is clearer
function generateContent(prompt) {
    return fetch('/.netlify/functions/generate-longcat', {
        method: 'POST',
        body: JSON.stringify({ prompt })
    })
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
        console.error('Error:', error);
    });
}
```

### Module Pattern - Organizing the Hive

**Keep code modular and organized:**

```javascript
// ✅ Good - clear module structure
// ai-router.js
export class AIRouter {
    constructor() {
        this.routes = new Map();
    }
    
    registerRoute(name, handler) {
        this.routes.set(name, handler);
    }
    
    async route(name, params) {
        const handler = this.routes.get(name);
        if (!handler) {
            throw new Error(`No handler found for: ${name}`);
        }
        return await handler(params);
    }
}

// ✅ Good - single responsibility
// token-manager.js
export class TokenManager {
    async getBalance(userId) { /* ... */ }
    async deductTokens(userId, amount) { /* ... */ }
    async addTokens(userId, amount) { /* ... */ }
}
```

### Error Handling - Protecting the Colony

**Handle errors gracefully and informatively:**

```javascript
// ✅ Good - comprehensive error handling
async function processRequest(data) {
    try {
        validateInput(data);
        const result = await processData(data);
        return { success: true, result };
    } catch (error) {
        console.error('[Koloni Error]', error);
        
        // Return user-friendly error
        return {
            success: false,
            error: error.message || 'An unexpected error occurred in the hive'
        };
    }
}

// ✅ Good - custom error types
class HiveError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'HiveError';
        this.code = code;
    }
}

// ❌ Avoid - swallowing errors silently
try {
    riskyOperation();
} catch (error) {
    // Silent failure - bad!
}
```

---

## 2. Netlify Functions Architecture - The Worker Bees

> Each worker bee has a specific job - our serverless functions follow the same principle.

### Function Structure - The Hive Blueprint

**Every Netlify function should follow this structure:**

```javascript
// /.netlify/functions/example-function.js
exports.handler = async (event, context) => {
    // 1. CORS headers - welcome all friendly bees
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    // 2. Handle OPTIONS requests (preflight)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        // 3. Parse request body
        const requestData = JSON.parse(event.body || '{}');
        
        // 4. Validate input
        if (!requestData.requiredField) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required field' })
            };
        }
        
        // 5. Process request
        const result = await processLogic(requestData);
        
        // 6. Return success response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };
        
    } catch (error) {
        // 7. Handle errors gracefully
        console.error('[Function Error]', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal hive error',
                message: error.message 
            })
        };
    }
};
```

### AI Function Pattern - The Hive Mind Connection

**Pattern for AI-powered content generation:**

```javascript
// /.netlify/functions/generate-longcat.js
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        const { prompt, style, tone } = JSON.parse(event.body);
        
        // Build system prompt with colony context
        const systemPrompt = `You are the Koloni AI assistant, helping beekeepers create content...`;
        
        // Call AI with proper configuration
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });
        
        const generatedContent = completion.choices[0].message.content;
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                content: generatedContent,
                tokens_used: completion.usage.total_tokens
            })
        };
        
    } catch (error) {
        console.error('[AI Generation Error]', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: 'Failed to generate content' 
            })
        };
    }
};
```

### Token Management - Honey Economics

**Pattern for managing user credits/tokens:**

```javascript
// ✅ Good - atomic token operations
async function deductTokens(userId, amount) {
    // 1. Check balance first
    const currentBalance = await getBalance(userId);
    
    if (currentBalance < amount) {
        throw new HiveError('Insufficient honey reserves', 'INSUFFICIENT_TOKENS');
    }
    
    // 2. Deduct atomically
    const newBalance = await updateBalance(userId, currentBalance - amount);
    
    // 3. Log transaction
    await logTransaction({
        userId,
        type: 'deduction',
        amount,
        timestamp: new Date().toISOString()
    });
    
    return newBalance;
}
```

---

## 3. AI Integration - The Hive Mind

> The colony's collective intelligence - integrating AI thoughtfully and responsibly.

### Prompt Engineering - Guiding the Swarm

**Craft effective prompts for consistent results:**

```javascript
// ✅ Good - structured prompt with context
const systemPrompt = `You are a professional content creator for the Koloni platform.

Context: The user wants to create ${formatType} content.
Style: ${style}
Tone: ${tone}

Guidelines:
- Keep it engaging and concise
- Use emojis sparingly but effectively
- Focus on value for the audience
- Match the specified tone and style

Output Format:
- Title
- Main content
- Call to action
- Relevant hashtags (if applicable)`;

// ❌ Avoid - vague prompts
const prompt = "Write something about this topic";
```

### Rate Limiting - Sustainable Foraging

**Implement rate limiting to protect resources:**

```javascript
// ✅ Good - rate limiting logic
const rateLimiter = {
    requests: new Map(),
    
    isAllowed(userId, maxRequests = 10, windowMs = 60000) {
        const now = Date.now();
        const userRequests = this.requests.get(userId) || [];
        
        // Filter requests within time window
        const recentRequests = userRequests.filter(
            timestamp => now - timestamp < windowMs
        );
        
        if (recentRequests.length >= maxRequests) {
            return false;
        }
        
        // Add new request
        recentRequests.push(now);
        this.requests.set(userId, recentRequests);
        return true;
    }
};
```

### Response Caching - Storing Honey

**Cache responses when appropriate:**

```javascript
// ✅ Good - simple cache implementation
class ResponseCache {
    constructor(ttlMs = 300000) { // 5 minutes default
        this.cache = new Map();
        this.ttl = ttlMs;
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        const isExpired = Date.now() - item.timestamp > this.ttl;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }
    
    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
}
```

---

## 4. Security Best Practices - Protecting the Hive

> A secure hive is a thriving hive.

### Environment Variables - Secret Nectar

**NEVER commit secrets:**

```javascript
// ✅ Good - use environment variables
const apiKey = process.env.OPENAI_API_KEY;
const stripeSecret = process.env.STRIPE_SECRET_KEY;

// ❌ NEVER - hardcoded secrets
const apiKey = 'sk-abc123...'; // DANGEROUS!
```

### Input Validation - Guard Bees

**Validate all user input:**

```javascript
// ✅ Good - comprehensive validation
function validateContentRequest(data) {
    const errors = [];
    
    if (!data.prompt || typeof data.prompt !== 'string') {
        errors.push('Prompt is required and must be a string');
    }
    
    if (data.prompt && data.prompt.length > 1000) {
        errors.push('Prompt must be less than 1000 characters');
    }
    
    const validStyles = ['creative', 'professional', 'casual', 'humorous', 'educational'];
    if (data.style && !validStyles.includes(data.style)) {
        errors.push(`Style must be one of: ${validStyles.join(', ')}`);
    }
    
    if (errors.length > 0) {
        throw new ValidationError(errors);
    }
}
```

### Sanitization - Cleaning the Honeycomb

**Sanitize output to prevent XSS:**

```javascript
// ✅ Good - HTML escaping
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ✅ Good - sanitize before display
function displayContent(content) {
    const sanitized = escapeHtml(content);
    document.getElementById('output').innerHTML = sanitized;
}
```

### CORS Configuration - Controlled Access

**Set appropriate CORS headers:**

```javascript
// ✅ Good - production CORS
const headers = {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

// ✅ Good - verify origin in production
function getCorsHeaders(origin) {
    const allowedOrigins = [
        'https://koloni.netlify.app',
        'https://www.koloni.com'
    ];
    
    if (allowedOrigins.includes(origin)) {
        return { 'Access-Control-Allow-Origin': origin };
    }
    
    return { 'Access-Control-Allow-Origin': allowedOrigins[0] };
}
```

---

## 5. CSS Architecture - The Honeycomb Structure

> Like the perfect hexagons in a honeycomb, our CSS is structured and efficient.

### CSS Variables - The Colony's Palette

**Use CSS custom properties for theming:**

```css
/* ✅ Good - CSS variables for consistency */
:root {
    /* Colors - Hive palette */
    --color-primary: #FFB800;      /* Honey gold */
    --color-secondary: #2C2C2C;    /* Dark hive */
    --color-accent: #FF6B35;       /* Pollen orange */
    --color-background: #1A1A1A;   /* Night hive */
    --color-text: #F5F5F5;         /* Light wax */
    
    /* Spacing - Hexagonal grid */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 2rem;
    --spacing-xl: 4rem;
    
    /* Typography - Clear communication */
    --font-primary: 'Inter', sans-serif;
    --font-heading: 'Poppins', sans-serif;
    --font-size-sm: 0.875rem;
    --font-size-md: 1rem;
    --font-size-lg: 1.25rem;
    --font-size-xl: 2rem;
}
```

### BEM Naming - Organized Cells

**Use BEM (Block Element Modifier) methodology:**

```css
/* ✅ Good - BEM structure */
.hive-card { }
.hive-card__header { }
.hive-card__title { }
.hive-card__content { }
.hive-card--featured { }
.hive-card--compact { }

/* ✅ Good - semantic class names */
.creator-studio { }
.creator-studio__prompt-input { }
.creator-studio__generate-button { }
.creator-studio__output-display { }
.creator-studio__output-display--loading { }

/* ❌ Avoid - unclear names */
.card { }
.c1 { }
.thing { }
```

### Component-Based CSS - Modular Honeycombs

**Organize CSS by component:**

```css
/* creator.css */

/* Component: Generation Form */
.generation-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background: var(--color-background);
    border-radius: 8px;
}

.generation-form__input {
    width: 100%;
    padding: var(--spacing-md);
    border: 2px solid var(--color-primary);
    border-radius: 4px;
    background: var(--color-secondary);
    color: var(--color-text);
    font-family: var(--font-primary);
}

.generation-form__button {
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--color-primary);
    color: var(--color-secondary);
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
}

.generation-form__button:hover {
    transform: translateY(-2px);
}

.generation-form__button--loading {
    opacity: 0.6;
    cursor: not-allowed;
}
```

### Responsive Design - Adapting the Hive

**Mobile-first responsive approach:**

```css
/* ✅ Good - mobile-first */
.hive-container {
    padding: var(--spacing-md);
    width: 100%;
}

/* Tablet */
@media (min-width: 768px) {
    .hive-container {
        padding: var(--spacing-lg);
        max-width: 720px;
        margin: 0 auto;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .hive-container {
        max-width: 1200px;
    }
}
```

### Glassmorphism Effects - Crystal Clear Cells

**Modern glass-like UI elements:**

```css
/* ✅ Good - glassmorphism for modern UI */
.glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.glass:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(245, 158, 11, 0.5);
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
}
```

### Component Styling - Building Honeycomb Cells

**Real-world component patterns for the Creator Studio:**

```css
/* ✅ Good - BEM-like naming for clarity */
/* 🏗️ Creator Studio - the main hive structure */
.creator-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #0A0A0B 0%, #1a1a2e 50%, #16213e 100%);
}

.creator-header {
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: var(--space-4);
}

.creator-main {
    display: grid;
    grid-template-columns: 250px 1fr;
    min-height: calc(100vh - 80px);
}

.creator-sidebar {
    position: sticky;
    top: 80px;
    height: calc(100vh - 80px);
    background: rgba(255, 255, 255, 0.02);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    padding: var(--space-6) var(--space-4);
}

.creator-content {
    padding: var(--space-8);
}

/* 🐝 Navigation items - like cells in the hive */
.nav-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.3s ease;
}

.nav-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--primary-gold);
}

.nav-item.active {
    background: rgba(245, 158, 11, 0.1);
    color: var(--primary-gold);
    border-left: 3px solid var(--primary-gold);
}
```

### Layout Patterns - Hexagonal Grid System

**Grid and flexbox patterns for organized layouts:**

```css
/* ✅ Good - Grid layout for main structure */
.creator-main {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 0;
}

/* ✅ Good - Flexbox for component internals */
.creator-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.token-display {
    display: flex;
    align-items: center;
    gap: var(--space-2);
}

/* ✅ Good - Responsive grid for cards */
.hive-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space-6);
    padding: var(--space-6);
}

/* ✅ Good - Flex wrap for tags/badges */
.tag-container {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
}

/* ❌ Avoid - overly complex grid patterns */
.complex-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: repeat(8, 100px);
    /* Too rigid, hard to maintain */
}
```

---

## 6. Testing Strategy - Quality Control

> Every bee checks its work - testing ensures hive quality.

### Unit Testing - Individual Bee Tasks

**Test individual functions:**

```javascript
// ✅ Good - unit test example
describe('TokenManager', () => {
    test('deducts tokens correctly', async () => {
        const manager = new TokenManager();
        const userId = 'test-bee-123';
        
        await manager.addTokens(userId, 100);
        await manager.deductTokens(userId, 30);
        
        const balance = await manager.getBalance(userId);
        expect(balance).toBe(70);
    });
    
    test('throws error on insufficient tokens', async () => {
        const manager = new TokenManager();
        const userId = 'test-bee-456';
        
        await manager.addTokens(userId, 10);
        
        await expect(
            manager.deductTokens(userId, 20)
        ).rejects.toThrow('Insufficient honey reserves');
    });
});
```

### Integration Testing - Hive Coordination

**Test component interactions:**

```javascript
// ✅ Good - integration test
describe('Content Generation Flow', () => {
    test('generates and stores content', async () => {
        const prompt = 'Write about bees';
        const userId = 'test-user';
        
        // Check initial token balance
        const initialBalance = await getTokenBalance(userId);
        
        // Generate content
        const result = await generateContent({
            userId,
            prompt,
            format: 'longcat'
        });
        
        expect(result.success).toBe(true);
        expect(result.content).toBeDefined();
        
        // Verify tokens were deducted
        const newBalance = await getTokenBalance(userId);
        expect(newBalance).toBeLessThan(initialBalance);
    });
});
```

### Manual Testing Checklist - Hive Inspection

**Before deploying:**

- [ ] Test all user flows in local environment
- [ ] Verify API endpoints return correct responses
- [ ] Check error handling for edge cases
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices
- [ ] Verify environment variables are set correctly
- [ ] Check console for errors and warnings
- [ ] Test payment flows (Stripe)
- [ ] Verify AI generations work as expected
- [ ] Test export functionality for all platforms

---

## 7. Accessibility Standards - Welcoming All Beekeepers

> Every beekeeper should be able to access the hive.

### Semantic HTML - Clear Structure

**Use proper HTML elements:**

```html
<!-- ✅ Good - semantic structure -->
<header class="hive-header">
    <h1>Koloni Creator Studio</h1>
    <nav aria-label="Main navigation">
        <ul>
            <li><a href="/create">Create</a></li>
            <li><a href="/export">Export</a></li>
            <li><a href="/history">History</a></li>
        </ul>
    </nav>
</header>

<main>
    <section aria-labelledby="generation-heading">
        <h2 id="generation-heading">Generate Content</h2>
        <!-- Content here -->
    </section>
</main>

<!-- ❌ Avoid - divs for everything -->
<div class="header">
    <div class="title">Koloni</div>
    <div class="nav">...</div>
</div>
```

### ARIA Labels - Guiding the Blind Bees

**Add ARIA attributes for screen readers:**

```html
<!-- ✅ Good - descriptive ARIA labels -->
<button 
    aria-label="Generate LongCat content"
    class="generate-button">
    Generate
</button>

<div 
    role="alert" 
    aria-live="polite" 
    class="notification">
    Content generated successfully!
</div>

<input 
    type="text"
    aria-label="Content prompt"
    aria-describedby="prompt-hint"
    placeholder="Enter your prompt...">
<div id="prompt-hint" class="hint">
    Describe what you want to create
</div>
```

### Keyboard Navigation - Non-Flying Bees

**Ensure full keyboard accessibility:**

```javascript
// ✅ Good - keyboard navigation support
element.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'Enter':
        case ' ': // Space
            event.preventDefault();
            triggerAction();
            break;
        case 'Escape':
            closeModal();
            break;
    }
});

// ✅ Good - focus management
function openModal(modalElement) {
    modalElement.classList.add('active');
    const firstFocusable = modalElement.querySelector('button, input, a');
    firstFocusable?.focus();
}
```

### Color Contrast - Clear Visibility

**Ensure sufficient contrast ratios:**

```css
/* ✅ Good - high contrast */
:root {
    --text-on-dark: #FFFFFF;      /* 21:1 contrast */
    --text-on-light: #000000;     /* 21:1 contrast */
    --link-color: #FFB800;        /* 4.5:1+ on dark bg */
}

/* ❌ Avoid - low contrast */
.low-contrast {
    color: #888888;
    background: #999999;  /* Poor contrast */
}
```

---

## 8. Performance Optimization - Efficient Foraging

> Like bees finding the best flowers, optimize for efficiency.

### Lazy Loading - Load What You Need

**Defer non-critical resources:**

```javascript
// ✅ Good - lazy load images
<img 
    src="placeholder.jpg" 
    data-src="actual-image.jpg" 
    loading="lazy"
    alt="Hive visualization">

// ✅ Good - dynamic imports
async function loadHeavyModule() {
    const module = await import('./heavy-module.js');
    module.initialize();
}
```

### Debouncing - Controlled Activity

**Limit function execution frequency:**

```javascript
// ✅ Good - debounce for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

const searchInput = document.getElementById('search');
const debouncedSearch = debounce(performSearch, 300);
searchInput.addEventListener('input', debouncedSearch);
```

### Caching - Store the Honey

**Cache responses and computed values:**

```javascript
// ✅ Good - memoization
const memoize = (fn) => {
    const cache = new Map();
    return (...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
};

const expensiveCalculation = memoize((n) => {
    // Heavy computation here
    return result;
});
```

### Bundle Optimization - Efficient Transport

**Minimize payload size:**

```javascript
// ✅ Good - tree shaking with ES modules
import { specificFunction } from 'library';

// ❌ Avoid - importing entire library
import * as library from 'library';

// ✅ Good - code splitting
const HeavyComponent = () => import('./HeavyComponent.js');
```

---

## 9. Deployment & DevOps - Maintaining the Colony

> Keep the hive running smoothly in production.

### Environment Management - Different Hives

**Separate configurations for each environment:**

```bash
# .env.development
OPENAI_API_KEY=sk-dev-...
STRIPE_SECRET_KEY=sk_test_...
URL=http://localhost:8888

# .env.production
OPENAI_API_KEY=sk-prod-...
STRIPE_SECRET_KEY=sk_live_...
URL=https://koloni.netlify.app
```

### Build Process - Preparing the Hive

**Automated build steps:**

```javascript
// build.js
const fs = require('fs-extra');
const path = require('path');

async function build() {
    console.log('🐝 Building the hive...');
    
    // Clean old build
    await fs.remove('dist');
    
    // Copy source files
    await fs.copy('src', 'dist/src');
    
    // Copy public assets
    await fs.copy('public', 'dist/public');
    
    console.log('✅ Hive built successfully!');
}

build().catch(console.error);
```

### Monitoring - Hive Health Check

**Track application health:**

```javascript
// ✅ Good - error logging
function logError(error, context) {
    console.error('[Koloni Error]', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
    });
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
        // Send to external monitoring
    }
}
```

### Deployment Checklist - Pre-Flight

**Before deploying to production:**

- [ ] All tests pass
- [ ] Environment variables configured
- [ ] API keys are production keys (not test/dev)
- [ ] Build completes without errors
- [ ] No console errors in production build
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Monitoring/logging set up
- [ ] Backup strategy in place
- [ ] Rollback plan documented

---

## 🎯 Quick Reference - The Hive Mind Cheat Sheet

### Common Commands

```bash
# Development
npm run dev                  # Start local development
node build.js                # Build the project
netlify dev                  # Run with Netlify functions

# Deployment
netlify deploy --prod        # Deploy to production

# Git Submodules (Spark)
git submodule init           # Initialize submodules
git submodule update         # Update submodules
```

### File Structure

```
Koloni/
├── src/
│   ├── components/         # Reusable UI components
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   └── *.html             # HTML pages
├── netlify/functions/     # Serverless functions
├── spark/                 # Apache Spark submodule
├── docs/                  # Documentation
└── public/                # Static assets
```

### Key Principles

1. **🐝 Modularity**: Keep functions small and focused
2. **🍯 Consistency**: Follow established patterns
3. **🏰 Security**: Validate input, sanitize output, protect secrets
4. **♿ Accessibility**: Make it usable for everyone
5. **⚡ Performance**: Optimize, cache, lazy load
6. **📝 Documentation**: Comment complex logic, document APIs
7. **🧪 Testing**: Test early, test often
8. **🎨 Theming**: Embrace the bee/hive aesthetic

---

## 🤝 Contributing to the Hive

When contributing to Koloni:

1. **Read this document** - Understand our standards
2. **Follow the patterns** - Consistency is key
3. **Test your changes** - Quality matters
4. **Document your work** - Help future bees
5. **Review before submitting** - Polish before PR
6. **Embrace the theme** - We're building a hive! 🐝

---

## 📚 Additional Resources

- [AI Tools Guide](./docs/AI_TOOLS_GUIDE.md) - GitHub Copilot & AI assistance
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Production deployment guide
- [README](./README.md) - Project overview and setup

---

**Remember**: Like a bee colony, our codebase thrives on collaboration, clear communication, and each developer doing their part to maintain the hive. 🐝🍯

*Built with 🐝 by the Koloni community*
