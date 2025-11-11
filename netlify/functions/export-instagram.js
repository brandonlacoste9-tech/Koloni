/**
 * Netlify Function: Export to Instagram
 * Handles formatting and exporting content for Instagram
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

    // Format content for Instagram based on type
    let formattedContent = {
      caption: '',
      hashtags: [],
      mediaType: format || 'post'
    };

    // Parse and format content
    if (typeof content === 'string') {
      // Split content into caption and hashtags
      const lines = content.split('\n');
      const hashtagLine = lines.find(line => line.includes('#'));
      
      if (hashtagLine) {
        formattedContent.hashtags = hashtagLine.match(/#\w+/g) || [];
        formattedContent.caption = lines
          .filter(line => !line.includes('#'))
          .join('\n')
          .trim();
      } else {
        formattedContent.caption = content;
      }
    } else if (content.text) {
      formattedContent.caption = content.text;
      formattedContent.hashtags = content.hashtags || [];
    }

    // Apply Instagram-specific formatting
    // Max caption length: 2,200 characters
    if (formattedContent.caption.length > 2200) {
      formattedContent.caption = formattedContent.caption.substring(0, 2197) + '...';
    }

    // Max hashtags: 30
    if (formattedContent.hashtags.length > 30) {
      formattedContent.hashtags = formattedContent.hashtags.slice(0, 30);
    }

    // Add spacing for readability
    const finalCaption = formattedContent.caption + '\n.\n.\n.\n' + formattedContent.hashtags.join(' ');

    // Generate export data
    const exportData = {
      platform: 'instagram',
      content: finalCaption,
      metadata: {
        captionLength: formattedContent.caption.length,
        hashtagCount: formattedContent.hashtags.length,
        mediaType: formattedContent.mediaType,
        exportedAt: new Date().toISOString()
      },
      tips: [
        'Copy the content below and paste into Instagram',
        'Add your image or video in Instagram',
        'Post at optimal times for your audience',
        'Engage with comments within the first hour'
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
    console.error('Error in export-instagram:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to export to Instagram', details: error.message })
    };
  }
};
