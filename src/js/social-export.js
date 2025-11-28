/**
 * Social Media Export Handler
 * User-friendly interface for exporting videos to social media platforms
 */

class SocialMediaExporter {
  constructor() {
    this.platforms = [];
    this.currentJobId = null;
    this.init();
  }

  async init() {
    await this.loadPlatforms();
    this.setupEventListeners();
  }

  async loadPlatforms() {
    try {
      const response = await fetch('/.netlify/functions/get-platforms');
      if (response.ok) {
        const data = await response.json();
        this.platforms = data.platforms || [];
        this.renderPlatformSelector();
      }
    } catch (error) {
      console.error('Error loading platforms:', error);
    }
  }

  setupEventListeners() {
    // Export button click
    document.addEventListener('click', (e) => {
      if (e.target.matches('.export-to-social-btn')) {
        const jobId = e.target.dataset.jobId;
        this.showExportModal(jobId);
      }
    });

    // Platform selection
    document.addEventListener('change', (e) => {
      if (e.target.matches('.platform-select')) {
        this.updatePlatformInfo(e.target.value);
      }
    });

    // Export form submission
    const exportForm = document.getElementById('social-export-form');
    if (exportForm) {
      exportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleExport(e.target);
      });
    }
  }

  renderPlatformSelector() {
    const container = document.getElementById('platform-selector');
    if (!container) return;

    container.innerHTML = this.platforms.map(platform => `
      <div class="platform-option glass-card" data-platform="${platform.id}">
        <input 
          type="radio" 
          name="platform" 
          value="${platform.id}" 
          id="platform-${platform.id}"
          class="platform-select"
        >
        <label for="platform-${platform.id}">
          <div class="platform-icon">${this.getPlatformIcon(platform.id)}</div>
          <div class="platform-info">
            <h3>${platform.name}</h3>
            <p>Max: ${platform.specs.max_duration}s • ${platform.specs.recommended_resolution}</p>
          </div>
        </label>
      </div>
    `).join('');
  }

  getPlatformIcon(platformId) {
    const icons = {
      facebook: '📘',
      instagram: '📷',
      youtube: '📺',
      tiktok: '🎵',
      twitter: '🐦',
      linkedin: '💼',
      snapchat: '👻'
    };
    return icons[platformId] || '📱';
  }

  updatePlatformInfo(platformId) {
    const platform = this.platforms.find(p => p.id === platformId);
    if (!platform) return;

    const infoContainer = document.getElementById('platform-specs');
    if (infoContainer) {
      infoContainer.innerHTML = `
        <h4>${platform.name} Requirements</h4>
        <ul>
          <li>Duration: ${platform.specs.min_duration}s - ${platform.specs.max_duration}s</li>
          <li>Resolution: ${platform.specs.recommended_resolution}</li>
          <li>Aspect Ratio: ${platform.specs.aspect_ratios.join(', ')}</li>
          <li>Max File Size: ${platform.specs.max_file_size_mb}MB</li>
        </ul>
      `;
    }
  }

  showExportModal(jobId) {
    this.currentJobId = jobId;
    
    // Create or show modal
    let modal = document.getElementById('social-export-modal');
    if (!modal) {
      modal = this.createExportModal();
      document.body.appendChild(modal);
    }
    
    modal.style.display = 'flex';
    this.loadJobDetails(jobId);
  }

  createExportModal() {
    const modal = document.createElement('div');
    modal.id = 'social-export-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content glass-panel">
        <div class="modal-header">
          <h2>Export to Social Media</h2>
          <button class="modal-close" aria-label="Close">&times;</button>
        </div>
        
        <form id="social-export-form">
          <input type="hidden" name="job_id" value="${this.currentJobId}">
          
          <div class="form-section">
            <h3>Select Platform</h3>
            <div id="platform-selector" class="platform-grid"></div>
            <div id="platform-specs" class="platform-specs"></div>
          </div>
          
          <div class="form-section">
            <h3>Post Details</h3>
            <div class="form-group">
              <label for="export-title">Title</label>
              <input 
                type="text" 
                id="export-title" 
                name="title" 
                class="glass-input"
                placeholder="Enter post title"
              >
            </div>
            
            <div class="form-group">
              <label for="export-description">Description</label>
              <textarea 
                id="export-description" 
                name="description" 
                class="glass-input"
                rows="4"
                placeholder="Enter post description"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="export-hashtags">Hashtags (comma-separated)</label>
              <input 
                type="text" 
                id="export-hashtags" 
                name="hashtags" 
                class="glass-input"
                placeholder="marketing, video, ai"
              >
            </div>
          </div>
          
          <div class="form-section">
            <h3>Platform Access</h3>
            <div class="form-group">
              <label for="access-token">Access Token</label>
              <input 
                type="password" 
                id="access-token" 
                name="access_token" 
                class="glass-input"
                placeholder="Enter platform API access token"
                required
              >
              <small>You can get this from your platform's developer settings</small>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary modal-close">Cancel</button>
            <button type="submit" class="btn btn-primary">
              <span class="btn-text">Export Video</span>
              <span class="btn-loader" style="display: none;">Exporting...</span>
            </button>
          </div>
        </form>
      </div>
    `;
    
    // Close modal handlers
    modal.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
    
    return modal;
  }

  async loadJobDetails(jobId) {
    try {
      const response = await fetch(`/.netlify/functions/get-video-status?job_id=${jobId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Pre-fill form with job details if available
        if (data.campaign_name) {
          const titleInput = document.getElementById('export-title');
          if (titleInput) titleInput.value = data.campaign_name;
        }
      }
    } catch (error) {
      console.error('Error loading job details:', error);
    }
  }

  async handleExport(form) {
    const formData = new FormData(form);
    const data = {
      job_id: formData.get('job_id'),
      platform: formData.querySelector('input[name="platform"]:checked')?.value,
      access_token: formData.get('access_token'),
      title: formData.get('title'),
      description: formData.get('description'),
      hashtags: formData.get('hashtags')?.split(',').map(t => t.trim()).filter(t => t)
    };
    
    if (!data.platform) {
      window.showToast('Please select a platform', 'warning');
      return;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-flex';
    submitBtn.disabled = true;
    
    try {
      const response = await fetch('/.netlify/functions/export-to-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        window.showToast(`Video exported to ${data.platform} successfully!`, 'success');
        document.getElementById('social-export-modal').style.display = 'none';
        
        // Show success message with link
        if (result.post_url) {
          setTimeout(() => {
            if (confirm(`Video exported! View post?`)) {
              window.open(result.post_url, '_blank');
            }
          }, 1000);
        }
      } else {
        throw new Error(result.message || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      window.showToast(error.message || 'Failed to export video', 'error');
    } finally {
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
      submitBtn.disabled = false;
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  window.socialExporter = new SocialMediaExporter();
});

