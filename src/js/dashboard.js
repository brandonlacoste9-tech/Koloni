const dashboardContent = document.getElementById('dashboard-content');
const skeleton = document.getElementById('loading-skeleton');
const historyList = document.getElementById('generation-history');
const historyEmpty = document.getElementById('history-empty');
const tokenBalanceEl = document.getElementById('token-balance');
const totalGenerationsEl = document.getElementById('total-generations');
const exportsCountEl = document.getElementById('exports-count');
const lastGenerationEl = document.getElementById('last-generation');
const lastExportEl = document.getElementById('last-export');
const tokensTodayEl = document.getElementById('tokens-today');
const userNameEl = document.getElementById('user-name');
const refreshBtn = document.getElementById('refresh-generations');

function getAuthHeaders() {
  const token = window.Auth?.requireAuth?.();
  if (!token) {
    return null;
  }
  return {
    Authorization: `Bearer ${token}`
  };
}

function toggleLoading(isLoading) {
  if (skeleton) {
    skeleton.style.display = isLoading ? 'block' : 'none';
  }
  if (dashboardContent) {
    dashboardContent.style.display = isLoading ? 'none' : 'flex';
  }
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleString();
}

function calculateTokensToday(generations) {
  const today = new Date();
  return generations
    .filter(gen => {
      const date = new Date(gen.createdAt);
      return date.toDateString() === today.toDateString();
    })
    .reduce((total, gen) => total + (gen.tokenCost || 0), 0);
}

function renderHistory(generations) {
  if (!historyList) return;

  historyList.innerHTML = '';

  if (!generations.length) {
    historyEmpty?.removeAttribute('hidden');
    historyList.style.display = 'none';
    return;
  }

  historyEmpty?.setAttribute('hidden', 'true');
  historyList.style.display = 'flex';

  generations.forEach((gen) => {
    const item = document.createElement('li');
    item.className = 'history-item';
    item.innerHTML = `
      <h4>${gen.type?.toUpperCase() || 'GENERATION'}</h4>
      <p>${gen.preview || gen.result?.substring(0, 140) || 'Content ready.'}</p>
      <div class="history-meta">
        <span>${gen.tokenCost || 0} tokens</span> ·
        <span>${new Date(gen.createdAt).toLocaleString()}</span>
      </div>
    `;
    historyList.appendChild(item);
  });
}

function updateStats(balanceData, historyData) {
  tokenBalanceEl.textContent = balanceData.tokens ?? 0;
  totalGenerationsEl.textContent = historyData.total ?? historyData.generations?.length ?? 0;

  const generations = historyData.generations || [];
  const exportRuns = generations.filter(gen => gen.type && gen.type.includes('export')).length;
  exportsCountEl.textContent = exportRuns;

  userNameEl.textContent = balanceData.name || 'Creator';
  lastGenerationEl.textContent = generations.length ? formatTimestamp(generations[0].createdAt) : 'No runs yet';
  const lastExport = generations.find(gen => gen.type && gen.type.includes('export'));
  lastExportEl.textContent = lastExport ? formatTimestamp(lastExport.createdAt) : 'No exports yet';
  tokensTodayEl.textContent = calculateTokensToday(generations);
}

async function fetchJSON(path) {
  const headers = getAuthHeaders();
  if (!headers) return null;

  const response = await fetch(path, { headers });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

async function loadDashboard() {
  toggleLoading(true);

  try {
    const [balanceData, historyData] = await Promise.all([
      fetchJSON('/.netlify/functions/get-user-balance'),
      fetchJSON('/.netlify/functions/get-generations?limit=6')
    ]);

    if (!balanceData || !historyData) {
      throw new Error('Authentication required.');
    }

    updateStats(balanceData, historyData);
    renderHistory(historyData.generations || []);
  } catch (error) {
    console.error('Dashboard load error:', error);
    window.showToast(error.message || 'Unable to load dashboard.', 'error');
  } finally {
    toggleLoading(false);
  }
}

refreshBtn?.addEventListener('click', loadDashboard);

loadDashboard();
