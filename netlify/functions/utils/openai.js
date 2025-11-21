/**
 * OpenAI Integration Utilities
 * Handles AI content generation for all content types
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Content Type Configurations
 */
const CONTENT_TYPES = {
  longcat: {
    name: 'LongCat',
    description: 'Long-form content (1000-2000 words)',
    maxTokens: 2500,
    temperature: 0.7,
    creditCost: 5
  },
  emu: {
    name: 'Emu',
    description: 'Short-form content (100-300 words)',
    maxTokens: 500,
    temperature: 0.8,
    creditCost: 1
  },
  ad: {
    name: 'Ad Copy',
    description: 'Advertising copy (50-150 words)',
    maxTokens: 300,
    temperature: 0.9,
    creditCost: 2
  },
  blog: {
    name: 'Blog Post',
    description: 'Blog article (500-1500 words)',
    maxTokens: 2000,
    temperature: 0.7,
    creditCost: 4
  }
};

/**
 * Tone Presets
 */
const TONE_PRESETS = {
  professional: 'professional, authoritative, and informative',
  casual: 'casual, friendly, and conversational',
  friendly: 'warm, approachable, and engaging',
  formal: 'formal, precise, and academic',
  persuasive: 'compelling, persuasive, and action-oriented',
  creative: 'creative, imaginative, and innovative'
};

/**
 * Generate LongCat Content (Long-form)
 */
async function generateLongCat(prompt, options = {}) {
  const {
    tone = 'professional',
    keywords = [],
    targetAudience = 'general'
  } = options;

  const systemPrompt = `You are an expert content writer specializing in comprehensive, well-researched long-form content. 
Write in a ${TONE_PRESETS[tone]} tone. Target audience: ${targetAudience}.
${keywords.length > 0 ? `Include these keywords naturally: ${keywords.join(', ')}` : ''}

Create content that is:
- In-depth and thoroughly researched
- Well-structured with clear sections
- Engaging and valuable to readers
- 1000-2000 words in length
- SEO-optimized
- Include relevant examples and insights`;

  return await generateContent(prompt, systemPrompt, CONTENT_TYPES.longcat);
}

/**
 * Generate Emu Content (Short-form)
 */
async function generateEmu(prompt, options = {}) {
  const {
    tone = 'casual',
    platform = 'general',
    includeHashtags = false
  } = options;

  const systemPrompt = `You are a social media content expert specializing in engaging short-form content.
Write in a ${TONE_PRESETS[tone]} tone. Platform: ${platform}.

Create content that is:
- Concise and impactful (100-300 words)
- Attention-grabbing from the first sentence
- Easy to read and share
- Perfect for social media or quick reads
${includeHashtags ? '- Include 3-5 relevant hashtags at the end' : ''}
- Engaging and conversational`;

  return await generateContent(prompt, systemPrompt, CONTENT_TYPES.emu);
}

/**
 * Generate Ad Copy
 */
async function generateAdCopy(prompt, options = {}) {
  const {
    tone = 'persuasive',
    platform = 'general',
    cta = 'Learn More',
    targetAudience = 'general'
  } = options;

  const systemPrompt = `You are an expert advertising copywriter with a track record of high-converting campaigns.
Write in a ${TONE_PRESETS[tone]} tone. Platform: ${platform}. Target audience: ${targetAudience}.

Create ad copy that:
- Grabs attention immediately
- Highlights key benefits clearly
- Creates urgency or desire
- Includes a strong call-to-action: "${cta}"
- Is 50-150 words
- Focuses on emotional triggers and value proposition
- Is optimized for conversions`;

  return await generateContent(prompt, systemPrompt, CONTENT_TYPES.ad);
}

/**
 * Generate Blog Post
 */
async function generateBlogPost(prompt, options = {}) {
  const {
    tone = 'friendly',
    keywords = [],
    targetAudience = 'general',
    includeIntro = true,
    includeConclusion = true
  } = options;

  const systemPrompt = `You are a professional blog writer creating engaging, SEO-optimized content.
Write in a ${TONE_PRESETS[tone]} tone. Target audience: ${targetAudience}.
${keywords.length > 0 ? `Include these keywords naturally: ${keywords.join(', ')}` : ''}

Create a blog post that:
- Is 500-1500 words
- Has a compelling headline
${includeIntro ? '- Starts with an engaging introduction' : ''}
- Uses subheadings for easy scanning
- Includes actionable insights
${includeConclusion ? '- Ends with a strong conclusion' : ''}
- Is conversational yet informative
- Provides real value to readers`;

  return await generateContent(prompt, systemPrompt, CONTENT_TYPES.blog);
}

/**
 * Core Content Generation Function
 */
async function generateContent(userPrompt, systemPrompt, contentType) {
  try {
    const startTime = Date.now();

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: contentType.maxTokens,
      temperature: contentType.temperature,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const generatedContent = response.choices[0].message.content;
    const processingTime = Date.now() - startTime;

    return {
      success: true,
      content: generatedContent,
      metadata: {
        type: contentType.name,
        tokensUsed: response.usage.total_tokens,
        processingTime,
        model: response.model,
        creditCost: contentType.creditCost
      }
    };
  } catch (error) {
    console.error('OpenAI generation error:', error);
    
    return {
      success: false,
      error: error.message,
      errorType: error.code || 'unknown',
      metadata: {
        type: contentType.name,
        creditCost: contentType.creditCost
      }
    };
  }
}

/**
 * Get Content Type Information
 */
function getContentTypeInfo(type) {
  return CONTENT_TYPES[type] || null;
}

/**
 * Get All Content Types
 */
function getAllContentTypes() {
  return Object.keys(CONTENT_TYPES).map(key => ({
    id: key,
    ...CONTENT_TYPES[key]
  }));
}

/**
 * Validate Content Generation Request
 */
function validateGenerationRequest(type, prompt) {
  if (!CONTENT_TYPES[type]) {
    return {
      valid: false,
      error: `Invalid content type. Must be one of: ${Object.keys(CONTENT_TYPES).join(', ')}`
    };
  }

  if (!prompt || prompt.trim().length < 10) {
    return {
      valid: false,
      error: 'Prompt must be at least 10 characters long'
    };
  }

  if (prompt.length > 2000) {
    return {
      valid: false,
      error: 'Prompt must be less than 2000 characters'
    };
  }

  return { valid: true };
}

module.exports = {
  generateLongCat,
  generateEmu,
  generateAdCopy,
  generateBlogPost,
  getContentTypeInfo,
  getAllContentTypes,
  validateGenerationRequest,
  CONTENT_TYPES,
  TONE_PRESETS
};
