/**
 * AI Assistant - Real-time creative suggestions and improvements
 * Gives users intelligent feedback as they create
 */

class AIAssistant {
  constructor() {
    this.isActive = false;
    this.suggestions = [];
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadSuggestions();
  }

  setupEventListeners() {
    // Monitor text input for real-time suggestions
    const scriptInput = document.getElementById('video-script');
    if (scriptInput) {
      let debounceTimer;
      scriptInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.analyzeInput(e.target.value);
        }, 500);
      });
    }

    // Monitor campaign name
    const campaignInput = document.getElementById('campaign-name');
    if (campaignInput) {
      campaignInput.addEventListener('blur', (e) => {
        this.validateCampaignName(e.target.value);
      });
    }
  }

  async analyzeInput(text) {
    if (!text || text.length < 20) return;

    try {
      const response = await fetch('/.netlify/functions/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text, type: 'script' })
      });

      if (response.ok) {
        const data = await response.json();
        this.displaySuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
    }
  }

  displaySuggestions(suggestions) {
    let container = document.getElementById('ai-suggestions');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ai-suggestions';
      container.className = 'ai-suggestions-panel modern-card';
      const form = document.getElementById('ad-creator-form');
      if (form) {
        form.insertAdjacentElement('afterend', container);
      }
    }

    if (!suggestions || suggestions.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.innerHTML = `
      <div class="ai-suggestions-header">
        <span class="ai-icon">✨</span>
        <h3>AI Suggestions</h3>
        <button class="close-suggestions" aria-label="Close">×</button>
      </div>
      <div class="ai-suggestions-list">
        ${suggestions.map((s, i) => `
          <div class="ai-suggestion-item" data-index="${i}">
            <div class="suggestion-type ${s.type}">${this.getSuggestionIcon(s.type)}</div>
            <div class="suggestion-content">
              <p class="suggestion-text">${s.message}</p>
              ${s.action ? `<button class="suggestion-action" data-action="${s.action}" data-value="${s.value || ''}">Apply</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.style.display = 'block';

    // Handle suggestion actions
    container.querySelectorAll('.suggestion-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.applySuggestion(e.target.dataset.action, e.target.dataset.value);
      });
    });

    // Close button
    container.querySelector('.close-suggestions')?.addEventListener('click', () => {
      container.style.display = 'none';
    });
  }

  getSuggestionIcon(type) {
    const icons = {
      improve: '💡',
      add: '➕',
      optimize: '⚡',
      warning: '⚠️',
      tip: '💡'
    };
    return icons[type] || '✨';
  }

  async applySuggestion(action, value) {
    switch (action) {
      case 'add_hashtags':
        // Add hashtags to script
        const scriptInput = document.getElementById('video-script');
        if (scriptInput) {
          scriptInput.value += `\n\n${value}`;
        }
        break;
      case 'improve_text':
        // Replace text with improved version
        if (scriptInput) {
          scriptInput.value = value;
        }
        break;
      case 'add_call_to_action':
        // Add CTA
        if (scriptInput) {
          scriptInput.value += `\n\n${value}`;
        }
        break;
    }
    this.displaySuggestions([]); // Clear suggestions after applying
    window.showToast('Suggestion applied!', 'success');
  }

  validateCampaignName(name) {
    if (!name) return;

    const issues = [];
    if (name.length < 3) {
      issues.push('Campaign name is too short');
    }
    if (name.length > 50) {
      issues.push('Campaign name is too long');
    }

    if (issues.length > 0) {
      this.showValidationMessage(issues);
    }
  }

  showValidationMessage(issues) {
    // Show validation feedback
    console.log('Validation issues:', issues);
  }

  async loadSuggestions() {
    // Pre-load common suggestions
    this.suggestions = [];
  }
}

// Initialize AI Assistant
document.addEventListener('DOMContentLoaded', () => {
  window.aiAssistant = new AIAssistant();
});

