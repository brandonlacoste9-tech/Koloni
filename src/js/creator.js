/**
 * Koloni Creator Studio - Main Application Logic
 */

// Initialize AI Router
const aiRouter = new AIRouter();

// State management
const state = {
  currentTab: 'generate',
  generatedContent: null,
  history: [],
  tokenBalance: 0
};

// DOM Elements
const elements = {
  tokenBalance: document.getElementById('tokenBalance'),
  buyTokensBtn: document.getElementById('buyTokensBtn'),
  navItems: document.querySelectorAll('.nav-item'),
  tabContents: document.querySelectorAll('.tab-content'),
  generateForm: document.getElementById('generateForm'),
  generateBtn: document.getElementById('generateBtn'),
  resultContainer: document.getElementById('resultContainer'),
  resultContent: document.getElementById('resultContent'),
  copyBtn: document.getElementById('copyBtn'),
  exportResultBtn: document.getElementById('exportResultBtn'),
  regenerateBtn: document.getElementById('regenerateBtn'),
  exportForm: document.getElementById('exportForm'),
  exportBtn: document.getElementById('exportBtn'),
  exportResultContainer: document.getElementById('exportResultContainer'),
  exportResultContent: document.getElementById('exportResultContent'),
  copyExportBtn: document.getElementById('copyExportBtn'),
  historyList: document.getElementById('historyList')
};

/**
 * Initialize application
 */
async function init() {
  console.log('🐝 Initializing Koloni Creator Studio...');
  
  // Load token balance
  await loadTokenBalance();
  
  // Load history from localStorage
  loadHistory();
  
  // Setup event listeners
  setupEventListeners();
  
  console.log('✅ Creator Studio ready!');
}

/**
 * Load token balance
 */
async function loadTokenBalance() {
  try {
    const result = await aiRouter.getBalance();
    state.tokenBalance = result.balance;
    updateTokenDisplay();
  } catch (error) {
    console.error('Failed to load token balance:', error);
    elements.tokenBalance.textContent = 'Error';
  }
}

/**
 * Update token display
 */
function updateTokenDisplay() {
  elements.tokenBalance.textContent = state.tokenBalance;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Tab navigation
  elements.navItems.forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  // Buy tokens button
  elements.buyTokensBtn.addEventListener('click', () => {
    alert('Token purchase integration coming soon! This will integrate with Stripe.');
  });

  // Generate form
  elements.generateForm.addEventListener('submit', handleGenerate);

  // Result actions
  elements.copyBtn.addEventListener('click', () => copyToClipboard(state.generatedContent));
  elements.exportResultBtn.addEventListener('click', switchToExport);
  elements.regenerateBtn.addEventListener('click', handleRegenerate);

  // Export form
  elements.exportForm.addEventListener('submit', handleExport);

  // Export copy button
  elements.copyExportBtn.addEventListener('click', copyExportResult);
}

/**
 * Switch tabs
 */
function switchTab(tabName) {
  state.currentTab = tabName;

  // Update nav items
  elements.navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabName);
  });

  // Update tab contents
  elements.tabContents.forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}Tab`);
  });
}

/**
 * Handle content generation
 */
async function handleGenerate(e) {
  e.preventDefault();

  const format = document.querySelector('input[name="format"]:checked').value;
  const prompt = document.getElementById('prompt').value;
  const style = document.getElementById('style').value;
  const tone = document.getElementById('tone').value;

  // Show loading state
  setGenerateLoading(true);

  try {
    // Generate content
    const result = await aiRouter.generate(format, {
      prompt,
      style,
      tone,
      duration: format === 'longcat' ? 'medium' : undefined,
      length: format === 'emu' ? 'short' : undefined
    });

    // Update state with generated content
    state.generatedContent = result.content;

    // Reload token balance from server to ensure accuracy
    await loadTokenBalance();

    // Save to history
    addToHistory({
      format,
      prompt,
      content: result.content,
      metadata: result.metadata,
      timestamp: new Date().toISOString()
    });

    // Display result
    displayResult(result);

    // Show success message
    showNotification('✨ Content generated successfully!', 'success');

  } catch (error) {
    console.error('Generation error:', error);
    
    if (error.message.includes('Insufficient tokens')) {
      showNotification('💰 Insufficient tokens. Please purchase more tokens.', 'error');
    } else {
      showNotification(`❌ Generation failed: ${error.message}`, 'error');
    }
  } finally {
    setGenerateLoading(false);
  }
}

/**
 * Set generate loading state
 */
function setGenerateLoading(isLoading) {
  const btnText = elements.generateBtn.querySelector('.btn-text');
  const btnLoader = elements.generateBtn.querySelector('.btn-loader');
  
  elements.generateBtn.disabled = isLoading;
  btnText.style.display = isLoading ? 'none' : 'inline';
  btnLoader.style.display = isLoading ? 'inline' : 'none';
}

/**
 * Display generation result
 */
function displayResult(result) {
  elements.resultContent.innerHTML = `
    <div class="result-text">${formatContent(result.content)}</div>
    <div class="result-metadata">
      <span><strong>Format:</strong> ${result.metadata.format}</span>
      <span><strong>Generated:</strong> ${new Date(result.metadata.timestamp).toLocaleString()}</span>
    </div>
  `;
  elements.resultContainer.style.display = 'block';
  elements.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Format content for display
 */
function formatContent(content) {
  return content.replace(/\n/g, '<br>');
}

/**
 * Handle regenerate
 */
function handleRegenerate() {
  elements.generateForm.dispatchEvent(new Event('submit'));
}

/**
 * Switch to export tab and populate content
 */
function switchToExport() {
  switchTab('export');
  document.getElementById('exportContent').value = state.generatedContent;
}

/**
 * Handle export
 */
async function handleExport(e) {
  e.preventDefault();

  const platform = document.querySelector('input[name="platform"]:checked').value;
  const content = document.getElementById('exportContent').value;

  // Show loading state
  setExportLoading(true);

  try {
    const result = await aiRouter.export(platform, content, 'post');

    // Display export result
    displayExportResult(result, platform);

    showNotification('✅ Content formatted for export!', 'success');

  } catch (error) {
    console.error('Export error:', error);
    showNotification(`❌ Export failed: ${error.message}`, 'error');
  } finally {
    setExportLoading(false);
  }
}

/**
 * Set export loading state
 */
function setExportLoading(isLoading) {
  const btnText = elements.exportBtn.querySelector('.btn-text');
  const btnLoader = elements.exportBtn.querySelector('.btn-loader');
  
  elements.exportBtn.disabled = isLoading;
  btnText.style.display = isLoading ? 'none' : 'inline';
  btnLoader.style.display = isLoading ? 'inline' : 'none';
}

/**
 * Display export result
 */
function displayExportResult(result, platform) {
  let content = '';

  if (platform === 'instagram') {
    content = `
      <div class="export-section">
        <h4>📋 Instagram Caption</h4>
        <pre class="export-text">${result.content}</pre>
      </div>
      <div class="export-tips">
        <h4>💡 Tips</h4>
        <ul>
          ${result.tips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
      </div>
    `;
  } else if (platform === 'youtube') {
    content = `
      <div class="export-section">
        <h4>📝 Title</h4>
        <pre class="export-text">${result.title}</pre>
      </div>
      <div class="export-section">
        <h4>📋 Description</h4>
        <pre class="export-text">${result.description}</pre>
      </div>
      <div class="export-section">
        <h4>🏷️ Tags</h4>
        <pre class="export-text">${result.tags.join(', ')}</pre>
      </div>
      <div class="export-tips">
        <h4>💡 Tips</h4>
        <ul>
          ${result.tips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  elements.exportResultContent.innerHTML = content;
  elements.exportResultContainer.style.display = 'block';
  elements.exportResultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Copy to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('📋 Copied to clipboard!', 'success');
  } catch (error) {
    console.error('Copy failed:', error);
    showNotification('❌ Failed to copy', 'error');
  }
}

/**
 * Copy export result
 */
async function copyExportResult() {
  const text = elements.exportResultContent.innerText;
  await copyToClipboard(text);
}

/**
 * Add to history
 */
function addToHistory(item) {
  state.history.unshift(item);
  
  // Keep only last 20 items
  if (state.history.length > 20) {
    state.history = state.history.slice(0, 20);
  }
  
  saveHistory();
  renderHistory();
}

/**
 * Save history to localStorage
 */
function saveHistory() {
  localStorage.setItem('koloni_history', JSON.stringify(state.history));
}

/**
 * Load history from localStorage
 */
function loadHistory() {
  const saved = localStorage.getItem('koloni_history');
  if (saved) {
    state.history = JSON.parse(saved);
    renderHistory();
  }
}

/**
 * Render history
 */
function renderHistory() {
  if (state.history.length === 0) {
    elements.historyList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📋</span>
        <p>No generations yet. Start creating!</p>
      </div>
    `;
    return;
  }

  elements.historyList.innerHTML = state.history.map((item, index) => `
    <div class="history-item" data-index="${index}">
      <div class="history-header">
        <span class="history-format">${item.format}</span>
        <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
      </div>
      <div class="history-prompt">${item.prompt}</div>
      <div class="history-content">${item.content.substring(0, 150)}${item.content.length > 150 ? '...' : ''}</div>
      <div class="history-actions">
        <button class="btn btn-glass btn-sm" onclick="viewHistoryItem(${index})">View</button>
        <button class="btn btn-glass btn-sm" onclick="copyHistoryItem(${index})">Copy</button>
      </div>
    </div>
  `).join('');
}

/**
 * View history item
 */
function viewHistoryItem(index) {
  const item = state.history[index];
  state.generatedContent = item.content;
  displayResult({
    content: item.content,
    metadata: item.metadata || { format: item.format, timestamp: item.timestamp }
  });
  switchTab('generate');
}

/**
 * Copy history item
 */
function copyHistoryItem(index) {
  const item = state.history[index];
  copyToClipboard(item.content);
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Make functions globally available for inline onclick handlers
window.viewHistoryItem = viewHistoryItem;
window.copyHistoryItem = copyHistoryItem;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
