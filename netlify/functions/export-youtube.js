/**
 * Netlify Function: Export to YouTube
 * Handles formatting and exporting content for YouTube
 */

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { content, format, userId } = JSON.parse(event.body);

    // Validate required parameters
    if (!content || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters: content, userId' })
      };
    }

    // Format content for YouTube
    let formattedContent = {
      title: '',
      description: '',
      tags: [],
      format: format || 'video'
    };

    // Parse content
    if (typeof content === 'string') {
      const lines = content.split('\n').filter(line => line.trim());
      
      // First line as title
      formattedContent.title = lines[0] || 'Untitled Video';
      
      // Remaining lines as description
      formattedContent.description = lines.slice(1).join('\n');
      
      // Extract tags from hashtags
      const hashtags = content.match(/#\w+/g) || [];
      formattedContent.tags = hashtags.map(tag => tag.substring(1));
    } else if (content.title) {
      formattedContent.title = content.title;
      formattedContent.description = content.description || '';
      formattedContent.tags = content.tags || [];
    }

    // Apply YouTube-specific formatting
    // Max title length: 100 characters
    if (formattedContent.title.length > 100) {
      formattedContent.title = formattedContent.title.substring(0, 97) + '...';
    }

    // Max description length: 5,000 characters
    if (formattedContent.description.length > 5000) {
      formattedContent.description = formattedContent.description.substring(0, 4997) + '...';
    }

    // Max tags: 500 characters total, ~30 tags
    if (formattedContent.tags.length > 30) {
      formattedContent.tags = formattedContent.tags.slice(0, 30);
    }

    // Generate structured description with chapters and links section
    const structuredDescription = `${formattedContent.description}

──────────────────────────

📌 CHAPTERS
0:00 Introduction

──────────────────────────

🔗 LINKS
🌐 Website: [Your Website]
📱 Social: [Your Social Media]

──────────────────────────

#️⃣ TAGS
${formattedContent.tags.join(', ')}`;

    // Generate export data
    const exportData = {
      platform: 'youtube',
      title: formattedContent.title,
      description: structuredDescription,
      tags: formattedContent.tags,
      metadata: {
        titleLength: formattedContent.title.length,
        descriptionLength: structuredDescription.length,
        tagCount: formattedContent.tags.length,
        format: formattedContent.format,
        exportedAt: new Date().toISOString()
      },
      tips: [
        'Create an eye-catching thumbnail',
        'Upload during peak hours for your audience',
        'Add end screens and cards',
        'Respond to comments to boost engagement',
        'Include relevant keywords in title and description'
      ]
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        ...exportData
      })
    };

  } catch (error) {
    console.error('Error in export-youtube:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to export to YouTube', details: error.message })
    };
  }
};
