/**
 * Advanced Video Analytics
 * Real-time performance tracking and predictions
 */

class VideoAnalytics {
  constructor() {
    this.metrics = {};
    this.predictions = {};
    this.init();
  }

  async init() {
    await this.loadAnalytics();
    this.setupRealTimeUpdates();
  }

  async loadAnalytics() {
    try {
      const response = await fetch('/.netlify/functions/get-video-analytics', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.metrics = data.metrics || {};
        this.predictions = data.predictions || {};
        this.renderDashboard();
      }
    } catch (error) {
      console.error('Analytics load error:', error);
    }
  }

  renderDashboard() {
    const container = document.getElementById('analytics-dashboard');
    if (!container) return;

    container.innerHTML = `
      <div class="analytics-grid">
        <div class="analytics-card modern-card">
          <h3>Performance Score</h3>
          <div class="score-circle" data-score="${this.metrics.performanceScore || 0}">
            <span class="score-value">${this.metrics.performanceScore || 0}</span>
            <span class="score-label">/100</span>
          </div>
          <p class="score-trend ${this.metrics.trend || 'neutral'}">
            ${this.getTrendIcon(this.metrics.trend)} ${this.metrics.trendText || 'No change'}
          </p>
        </div>

        <div class="analytics-card modern-card">
          <h3>Predicted Engagement</h3>
          <div class="prediction-bar">
            <div class="prediction-fill" style="width: ${this.predictions.engagement || 0}%"></div>
          </div>
          <p class="prediction-text">${this.predictions.engagement || 0}% expected engagement</p>
          <small>Based on similar content performance</small>
        </div>

        <div class="analytics-card modern-card">
          <h3>Platform Optimization</h3>
          <div class="platform-scores">
            ${this.renderPlatformScores()}
          </div>
        </div>

        <div class="analytics-card modern-card">
          <h3>AI Recommendations</h3>
          <ul class="recommendations-list">
            ${this.renderRecommendations()}
          </ul>
        </div>
      </div>
    `;
  }

  renderPlatformScores() {
    const platforms = ['instagram', 'youtube', 'tiktok', 'facebook'];
    return platforms.map(platform => {
      const score = this.predictions[platform]?.score || 0;
      return `
        <div class="platform-score">
          <span class="platform-name">${platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
          <div class="score-bar">
            <div class="score-fill" style="width: ${score}%"></div>
          </div>
          <span class="score-percent">${score}%</span>
        </div>
      `;
    }).join('');
  }

  renderRecommendations() {
    const recommendations = this.predictions.recommendations || [
      'Optimize for mobile viewing',
      'Add captions for better engagement',
      'Consider shorter duration for TikTok'
    ];

    return recommendations.map(rec => `
      <li>
        <span class="rec-icon">💡</span>
        <span>${rec}</span>
      </li>
    `).join('');
  }

  getTrendIcon(trend) {
    const icons = {
      up: '📈',
      down: '📉',
      neutral: '➡️'
    };
    return icons[trend] || '➡️';
  }

  setupRealTimeUpdates() {
    // Update analytics every 30 seconds
    setInterval(() => {
      this.loadAnalytics();
    }, 30000);
  }
}

// Initialize analytics
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('analytics-dashboard')) {
    window.videoAnalytics = new VideoAnalytics();
  }
});

