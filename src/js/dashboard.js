/**
 * AdGenXAI Dashboard
 * Displays user stats, credit balance, and generation history
 */

// Check if the user is logged in
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login.html";
}

// Logout functionality
const logoutButton = document.getElementById("logout-button");
logoutButton?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
});

/**
 * Fetch user credit balance
 */
async function fetchCreditBalance() {
  try {
    const response = await fetch('/.netlify/functions/get-user-balance', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      document.getElementById('credit-balance').textContent = data.balance || 0;
    } else {
      document.getElementById('credit-balance').textContent = '0';
    }
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    document.getElementById('credit-balance').textContent = '0';
  }
}

/**
 * Fetch generation history
 */
async function fetchGenerationHistory() {
  try {
    const response = await fetch('/.netlify/functions/get-generations', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      displayGenerationHistory(data.generations || []);
      updateStats(data.generations || []);
    } else {
      displayGenerationHistory([]);
    }
  } catch (error) {
    console.error('Error fetching generation history:', error);
    displayGenerationHistory([]);
  }
}

/**
 * Display generation history in the UI
 */
function displayGenerationHistory(generations) {
  const historyList = document.getElementById('history-list');
  
  if (!historyList) return;
  
  if (generations.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state glass-card">
        <p>No generations yet. Start creating your first content!</p>
        <a href="/creator.html" class="btn btn-primary">Create Now</a>
      </div>
    `;
    return;
  }
  
  // Show only the 5 most recent
  const recentGenerations = generations.slice(0, 5);
  
  historyList.innerHTML = recentGenerations.map(gen => `
    <div class="history-item glass-card">
      <div class="history-info">
        <div class="history-header">
          <span class="format-badge ${gen.format}">${gen.format || 'Unknown'}</span>
          <span class="timestamp">${formatDate(gen.created_at)}</span>
        </div>
        <p class="history-content">${truncate(gen.content || gen.result || 'No content', 100)}</p>
      </div>
      <div class="history-actions">
        <button class="btn btn-ghost btn-sm" onclick="viewGeneration('${gen.id}')">View</button>
        <button class="btn btn-ghost btn-sm" onclick="copyContent('${escapeHtml(gen.content || gen.result || '')}')">Copy</button>
      </div>
    </div>
  `).join('');
}

/**
 * Update stats based on generation history
 */
function updateStats(generations) {
  // Total generations
  document.getElementById('total-generations').textContent = generations.length;
  
  // This month's generations
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthGenerations = generations.filter(g => new Date(g.created_at) >= monthStart);
  document.getElementById('month-generations').textContent = monthGenerations.length;
  
  // Success rate (assuming all stored generations are successful)
  const successRate = generations.length > 0 ? 100 : 0;
  document.getElementById('success-rate').textContent = `${successRate}%`;
  
  // Credits used (approximate - 1 per generation)
  document.getElementById('credits-used').textContent = generations.length;
  
  // Update chart
  updateUsageChart(generations);
}

/**
 * Update usage chart with generation data
 */
function updateUsageChart(generations) {
  const canvas = document.getElementById('usage-chart');
  if (!canvas || !canvas.getContext) {
    // Canvas not supported, show simple stats instead
    return;
  }
  
  const ctx = canvas.getContext('2d');
  
  // Count formats
  const longcatCount = generations.filter(g => g.format === 'longcat').length;
  const emuCount = generations.filter(g => g.format === 'emu').length;
  const total = Math.max(longcatCount + emuCount, 1);
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw simple bar chart
  const barWidth = 80;
  const maxHeight = 150;
  const spacing = 120;
  
  // LongCat bar
  const longcatHeight = (longcatCount / total) * maxHeight;
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(80, 200 - longcatHeight, barWidth, longcatHeight);
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(longcatCount.toString(), 120, 180 - longcatHeight);
  
  // Emu bar
  const emuHeight = (emuCount / total) * maxHeight;
  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(80 + spacing, 200 - emuHeight, barWidth, emuHeight);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(emuCount.toString(), 120 + spacing, 180 - emuHeight);
}

/**
 * Helper: Format date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Helper: Truncate text
 */
function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * View generation details
 */
window.viewGeneration = function(id) {
  window.location.href = `/creator.html?view=${id}`;
};

/**
 * Copy content to clipboard
 */
window.copyContent = function(content) {
  const decoded = content.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  
  navigator.clipboard.writeText(decoded).then(() => {
    window.showToast?.('Content copied to clipboard!', 'success');
  }).catch(err => {
    console.error('Failed to copy:', err);
    window.showToast?.('Failed to copy content', 'error');
  });
};

/**
 * Refresh history
 */
document.getElementById('refresh-history')?.addEventListener('click', () => {
  fetchGenerationHistory();
  window.showToast?.('Refreshing history...', 'info');
});

/**
 * Initialize dashboard
 */
async function initDashboard() {
  // Load user data
  await fetchCreditBalance();
  await fetchGenerationHistory();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
