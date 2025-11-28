const tokenDisplay = document.getElementById('tokenBalance');
const historyList = document.getElementById('historyList');
const buyTokensBtn = document.getElementById('buyTokensBtn');
const generateForm = document.getElementById('generateForm');
const generateBtn = document.getElementById('generateBtn');
const resultContainer = document.getElementById('resultContainer');
const resultContent = document.getElementById('resultContent');
const copyBtn = document.getElementById('copyBtn');
const exportShortcutBtn = document.getElementById('exportResultBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const exportForm = document.getElementById('exportForm');
const exportBtn = document.getElementById('exportBtn');
const exportContentField = document.getElementById('exportContent');
const exportResultContainer = document.getElementById('exportResultContainer');
const exportResultContent = document.getElementById('exportResultContent');
const copyExportBtn = document.getElementById('copyExportBtn');

const state = {
  lastGeneration: null,
  lastContent: ''
};

const router = window.AIRouter ? new window.AIRouter() : null;

function requireAuth() {
  return window.Auth?.requireAuth?.();
}

function toggleButtonLoading(button, isLoading, loadingText = 'Loading...') {
  if (!button) return;
  const textEl = button.querySelector('.btn-text');
  const loaderEl = button.querySelector('.btn-loader');

  if (textEl && loaderEl) {
    loaderEl.textContent = loadingText;
    loaderEl.style.display = isLoading ? 'inline-flex' : 'none';
    textEl.style.display = isLoading ? 'none' : 'inline';
  }

  button.disabled = isLoading;
}

async function fetchAuthed(path) {
  const token = requireAuth();
  if (!token) return null;

  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

async function refreshBalance(forcedValue) {
  try {
    if (typeof forcedValue === 'number') {
      tokenDisplay.textContent = forcedValue;
      return;
    }
    const data = await fetchAuthed('/.netlify/functions/get-user-balance');
    if (data?.tokens != null) {
      tokenDisplay.textContent = data.tokens;
    }
  } catch (error) {
    console.error('Balance error:', error);
  }
}

function renderHistoryItems(items = []) {
  if (!historyList) return;
  const emptyState = historyList.querySelector('.empty-state');
  historyList.innerHTML = '';

  if (!items.length) {
    if (emptyState) {
      historyList.appendChild(emptyState);
    }
    return;
  }

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'history-card glass-card';
    card.innerHTML = `
      <div class="history-card-header">
        <strong>${item.type?.toUpperCase() || 'GEN'}</strong>
        <span>${new Date(item.createdAt).toLocaleString()}</span>
      </div>
      <p>${item.preview || item.result?.substring(0, 140) || 'Content saved.'}</p>
      <small>${item.tokenCost || 0} tokens · ${item.style || 'creative'}</small>
    `;
    historyList.appendChild(card);
  });
}

async function loadHistory() {
  try {
    const data = await fetchAuthed('/.netlify/functions/get-generations?limit=5');
    renderHistoryItems(data?.generations || []);
  } catch (error) {
    console.error('History error:', error);
  }
}

function initTabs() {
  const navButtons = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      navButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
      tabContents.forEach((content) => content.classList.toggle('active', content.id === `${tabName}Tab`));
    });
  });
}

async function handleGeneration(event) {
  event.preventDefault();
  if (!router || !requireAuth()) return;

  const format = document.querySelector('input[name="format"]:checked')?.value || 'longcat';
  const prompt = generateForm.prompt.value.trim();
  const style = generateForm.style.value;
  const tone = generateForm.tone.value;

  if (!prompt) {
    window.showToast('Please enter a prompt before generating.', 'warning');
    return;
  }

  toggleButtonLoading(generateBtn, true, 'Generating...');

  try {
    const data = await router.generate(format, { prompt, style, tone });
    state.lastGeneration = { format, prompt, style, tone };
    state.lastContent = data.content;

    resultContent.textContent = data.content.trim();
    resultContainer.style.display = 'block';
    exportContentField.value = data.content.trim();

    window.showToast('Content ready! Tokens updated.', 'success');
    await refreshBalance(data.tokensRemaining);
    await loadHistory();
  } catch (error) {
    console.error('Generation error:', error);
    window.showToast(error.message || 'Generation failed. Please try again.', 'error');
  } finally {
    toggleButtonLoading(generateBtn, false);
  }
}

async function handleExport(event) {
  event.preventDefault();
  if (!router || !requireAuth()) return;

  const platform = document.querySelector('input[name="platform"]:checked')?.value || 'instagram';
  const content = exportContentField.value.trim();

  if (!content) {
    window.showToast('Paste or generate content to export.', 'warning');
    return;
  }

  toggleButtonLoading(exportBtn, true, 'Formatting...');

  try {
    const exportData = await router.export(platform, content, platform === 'instagram' ? 'post' : 'default');
    const exportText = exportData.content || exportData.description || '';
    exportResultContainer.style.display = 'block';
    exportResultContent.innerHTML = `
      <div class="export-block">
        <h4>${exportData.platform.toUpperCase()} Output</h4>
        <pre>${exportText}</pre>
        <div class="export-meta">
          <span>Length: ${exportData.metadata?.captionLength || exportData.metadata?.descriptionLength || exportText.length}</span>
          <span>Tags: ${exportData.metadata?.hashtagCount || exportData.metadata?.tagCount || 0}</span>
        </div>
        ${exportData.tips ? `<ul>${exportData.tips.map(tip => `<li>${tip}</li>`).join('')}</ul>` : ''}
      </div>
    `;
    window.showToast('Export formatted and ready to copy.', 'success');
  } catch (error) {
    console.error('Export error:', error);
    window.showToast(error.message || 'Failed to format content.', 'error');
  } finally {
    toggleButtonLoading(exportBtn, false);
  }
}

function initClipboard() {
  copyBtn?.addEventListener('click', async () => {
    if (!state.lastContent) {
      window.showToast('Generate something first.', 'warning');
      return;
    }
    await navigator.clipboard.writeText(state.lastContent);
    window.showToast('Copied to clipboard!', 'success');
  });

  copyExportBtn?.addEventListener('click', async () => {
    const text = exportResultContent.textContent.trim();
    if (!text) {
      window.showToast('Nothing to copy yet.', 'warning');
      return;
    }
    await navigator.clipboard.writeText(text);
    window.showToast('Export copied to clipboard!', 'success');
  });
}

function initRegenerate() {
  regenerateBtn?.addEventListener('click', () => {
    if (!state.lastGeneration) {
      window.showToast('Generate something first.', 'warning');
      return;
    }

    generateForm.prompt.value = state.lastGeneration.prompt;
    generateForm.style.value = state.lastGeneration.style;
    generateForm.tone.value = state.lastGeneration.tone;
    const formatInput = document.querySelector(`input[name="format"][value="${state.lastGeneration.format}"]`);
    if (formatInput) {
      formatInput.checked = true;
    }

    generateForm.requestSubmit();
  });
}

function initExportShortcut() {
  exportShortcutBtn?.addEventListener('click', () => {
    if (!state.lastContent) {
      window.showToast('Generate something first.', 'warning');
      return;
    }
    exportContentField.value = state.lastContent;
    document.querySelector('[data-tab="export"]')?.click();
  });
}

// Video generation handlers
const adCreatorForm = document.getElementById('ad-creator-form');
const videoContainer = document.getElementById('video-container');
const videoPlayer = document.getElementById('video-player');
const loadingState = document.getElementById('loading-state');

async function handleVideoGeneration(event) {
  event.preventDefault();
  if (!requireAuth()) return;

  const campaignName = document.getElementById('campaign-name')?.value.trim();
  const script = document.getElementById('video-script')?.value.trim();

  if (!script || script.length < 20) {
    window.showToast('Please provide a detailed video script (at least 20 characters).', 'warning');
    return;
  }

  // Show loading state
  if (loadingState) loadingState.style.display = 'block';
  if (videoContainer) videoContainer.style.display = 'none';
  if (adCreatorForm) adCreatorForm.style.opacity = '0.5';

  try {
    const response = await fetch('/.netlify/functions/generate-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        script,
        campaignName: campaignName || 'Untitled Campaign',
        style: 'creative',
        duration: 30,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Video generation failed');
    }

    // Hide loading state
    if (loadingState) loadingState.style.display = 'none';
    if (adCreatorForm) adCreatorForm.style.opacity = '1';

    if (data.videoUrl) {
      // Video is ready
      if (videoPlayer) {
        videoPlayer.src = data.videoUrl;
        videoPlayer.load();
      }
      if (videoContainer) videoContainer.style.display = 'block';
      
      // Update export button with job ID
      const exportBtn = document.getElementById('export-social-btn');
      if (exportBtn && data.jobId) {
        exportBtn.dataset.jobId = data.jobId;
        exportBtn.style.display = 'inline-block';
      }
      
      window.showToast('Video generated successfully!', 'success');
    } else {
      // Video is pending
      window.showToast(
        data.message || 'Video generation queued. You will be notified when ready.',
        'info'
      );
      // Store videoId for polling
      if (data.videoId || data.jobId) {
        const jobId = data.jobId || data.videoId;
        localStorage.setItem('pendingVideoId', jobId);
        
        // Update export button
        const exportBtn = document.getElementById('export-social-btn');
        if (exportBtn) {
          exportBtn.dataset.jobId = jobId;
        }
        
        // Start polling for video status
        pollVideoStatus(jobId);
      }
    }

    await refreshBalance(data.tokensRemaining);
    await loadHistory();
  } catch (error) {
    console.error('Video generation error:', error);
    window.showToast(error.message || 'Failed to generate video. Please try again.', 'error');
    if (loadingState) loadingState.style.display = 'none';
    if (adCreatorForm) adCreatorForm.style.opacity = '1';
  }
}

async function pollVideoStatus(videoId) {
  // Poll every 5 seconds for video status
  const maxAttempts = 60; // 5 minutes max
  let attempts = 0;

  const pollInterval = setInterval(async () => {
    attempts++;
    if (attempts > maxAttempts) {
      clearInterval(pollInterval);
      window.showToast('Video generation is taking longer than expected. Please check back later.', 'warning');
      return;
    }

    try {
      // You would implement a status check endpoint here
      // For now, we'll just show a message
      console.log(`Polling video status: ${videoId} (attempt ${attempts})`);
    } catch (error) {
      console.error('Error polling video status:', error);
    }
  }, 5000);
}

function initVideoHandlers() {
  // Handle video form submission
  if (adCreatorForm) {
    adCreatorForm.addEventListener('submit', handleVideoGeneration);
  }

  // Handle video download button
  const downloadBtn = videoContainer?.querySelector('.btn-success');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (videoPlayer?.src) {
        const a = document.createElement('a');
        a.href = videoPlayer.src;
        a.download = `video-${Date.now()}.mp4`;
        a.click();
        window.showToast('Download started!', 'success');
      } else {
        window.showToast('No video available to download.', 'warning');
      }
    });
  }

  // Handle video share button
  const shareBtn = videoContainer?.querySelector('.btn-secondary');
  if (shareBtn && shareBtn.textContent.includes('Share')) {
    shareBtn.addEventListener('click', async () => {
      if (videoPlayer?.src) {
        try {
          await navigator.share({
            title: 'Check out this video!',
            text: 'Generated with AdGenXAI',
            url: videoPlayer.src,
          });
          window.showToast('Video shared!', 'success');
        } catch (error) {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(videoPlayer.src);
          window.showToast('Video URL copied to clipboard!', 'success');
        }
      } else {
        window.showToast('No video available to share.', 'warning');
      }
    });
  }
}

function initCreatorStudio() {
  if (!requireAuth()) return;

  initTabs();
  initClipboard();
  initVideoHandlers();

  buyTokensBtn?.addEventListener('click', () => (window.location.href = '/pricing.html'));

  generateForm?.addEventListener('submit', handleGeneration);
  exportForm?.addEventListener('submit', handleExport);

  initRegenerate();
  initExportShortcut();

  refreshBalance();
  loadHistory();
}

document.addEventListener('DOMContentLoaded', initCreatorStudio);
