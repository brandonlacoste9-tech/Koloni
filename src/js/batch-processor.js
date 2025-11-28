/**
 * Batch Video Processing
 * Process multiple videos at once for efficiency
 */

class BatchProcessor {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.init();
  }

  init() {
    this.setupUI();
    this.loadQueue();
  }

  setupUI() {
    // Add batch processing button
    const form = document.getElementById('ad-creator-form');
    if (form) {
      const batchBtn = document.createElement('button');
      batchBtn.type = 'button';
      batchBtn.className = 'btn-modern btn-modern-secondary';
      batchBtn.textContent = '📦 Add to Batch';
      batchBtn.onclick = () => this.addToBatch();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.parentNode.insertBefore(batchBtn, submitBtn);
      }
    }
  }

  addToBatch() {
    const form = document.getElementById('ad-creator-form');
    if (!form) return;

    const campaignName = document.getElementById('campaign-name')?.value;
    const script = document.getElementById('video-script')?.value;

    if (!script || script.length < 20) {
      window.showToast('Please enter a valid script first', 'warning');
      return;
    }

    const item = {
      id: Date.now(),
      campaignName: campaignName || 'Untitled',
      script,
      status: 'queued',
      createdAt: new Date().toISOString()
    };

    this.queue.push(item);
    this.saveQueue();
    this.renderBatchQueue();
    window.showToast('Added to batch queue!', 'success');
  }

  renderBatchQueue() {
    let container = document.getElementById('batch-queue');
    if (!container) {
      container = document.createElement('div');
      container.id = 'batch-queue';
      container.className = 'batch-queue-panel modern-card';
      document.querySelector('.creator-container')?.appendChild(container);
    }

    if (this.queue.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = `
      <div class="batch-header">
        <h3>📦 Batch Queue (${this.queue.length})</h3>
        <button class="btn-modern btn-modern-primary" onclick="window.batchProcessor.processAll()">
          Process All
        </button>
      </div>
      <div class="batch-list">
        ${this.queue.map((item, index) => `
          <div class="batch-item modern-card" data-id="${item.id}">
            <div class="batch-item-header">
              <span class="batch-number">#${index + 1}</span>
              <span class="batch-status ${item.status}">${item.status}</span>
              <button class="batch-remove" onclick="window.batchProcessor.removeFromBatch(${item.id})">×</button>
            </div>
            <div class="batch-item-content">
              <h4>${item.campaignName}</h4>
              <p>${item.script.substring(0, 100)}...</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  async processAll() {
    if (this.processing) {
      window.showToast('Already processing batch', 'warning');
      return;
    }

    this.processing = true;
    window.showToast(`Processing ${this.queue.length} videos...`, 'info');

    for (const item of this.queue) {
      try {
        item.status = 'processing';
        this.renderBatchQueue();

        // Process each item
        const response = await fetch('/.netlify/functions/generate-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            script: item.script,
            campaignName: item.campaignName
          })
        });

        if (response.ok) {
          item.status = 'completed';
          item.jobId = (await response.json()).jobId;
        } else {
          item.status = 'failed';
        }
      } catch (error) {
        item.status = 'failed';
        console.error('Batch processing error:', error);
      }

      this.renderBatchQueue();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between items
    }

    this.processing = false;
    window.showToast('Batch processing complete!', 'success');
  }

  removeFromBatch(id) {
    this.queue = this.queue.filter(item => item.id !== id);
    this.saveQueue();
    this.renderBatchQueue();
  }

  saveQueue() {
    localStorage.setItem('batchQueue', JSON.stringify(this.queue));
  }

  loadQueue() {
    const saved = localStorage.getItem('batchQueue');
    if (saved) {
      this.queue = JSON.parse(saved);
      this.renderBatchQueue();
    }
  }
}

// Initialize batch processor
document.addEventListener('DOMContentLoaded', () => {
  window.batchProcessor = new BatchProcessor();
});

