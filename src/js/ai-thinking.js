/**
 * AI Thinking State Manager
 * Shows thinking state until AI is ready
 */

class AIThinkingState {
  constructor() {
    this.thinkingElement = null;
    this.isThinking = false;
    this.init();
  }

  init() {
    this.createThinkingElement();
    this.checkAIReadiness();
  }

  createThinkingElement() {
    const thinking = document.createElement('div');
    thinking.id = 'ai-thinking';
    thinking.className = 'ai-thinking';
    thinking.innerHTML = `
      <div class="thinking-content">
        <div class="thinking-icon"></div>
        <h2 class="thinking-text">AI is thinking...</h2>
        <p class="thinking-subtext">Preparing your creative workspace</p>
        <div class="thinking-dots">
          <div class="thinking-dot"></div>
          <div class="thinking-dot"></div>
          <div class="thinking-dot"></div>
        </div>
      </div>
    `;
    document.body.appendChild(thinking);
    this.thinkingElement = thinking;
  }

  async checkAIReadiness() {
    // Check if services are ready
    try {
      const response = await fetch('/.netlify/functions/check-ai-ready');
      if (response.ok) {
        const data = await response.json();
        if (data.ready) {
          this.hide();
          return;
        }
      }
    } catch (error) {
      console.log('AI readiness check:', error);
    }

    // Fallback: Hide after a short delay
    setTimeout(() => {
      this.hide();
    }, 2000);
  }

  show() {
    if (this.thinkingElement) {
      this.thinkingElement.classList.remove('hidden');
      this.isThinking = true;
    }
  }

  hide() {
    if (this.thinkingElement) {
      this.thinkingElement.classList.add('hidden');
      this.isThinking = false;
      
      // Remove after animation
      setTimeout(() => {
        if (this.thinkingElement && this.thinkingElement.parentNode) {
          this.thinkingElement.parentNode.removeChild(this.thinkingElement);
        }
      }, 500);
    }
  }

  updateMessage(text, subtext = '') {
    if (this.thinkingElement) {
      const textEl = this.thinkingElement.querySelector('.thinking-text');
      const subtextEl = this.thinkingElement.querySelector('.thinking-subtext');
      if (textEl) textEl.textContent = text;
      if (subtextEl && subtext) subtextEl.textContent = subtext;
    }
  }
}

// Initialize on page load
let aiThinking = null;
document.addEventListener('DOMContentLoaded', () => {
  aiThinking = new AIThinkingState();
  window.aiThinking = aiThinking;
});

