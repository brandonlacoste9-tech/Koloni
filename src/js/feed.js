// ============================================
// ZYEUTÉ - Feed JavaScript
// ============================================

// State management
const state = {
  currentUser: null,
  posts: [],
  stories: [],
  currentTab: 'pour-toi',
  page: 1,
  hasMore: true,
  loading: false
};

// Initialize feed on page load
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  setupEventListeners();
  await loadStories();
  await loadPosts();
  await loadSuggestions();
  await loadTrending();
});

// ============================================
// Authentication
// ============================================

async function checkAuth() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const response = await fetch('/.netlify/functions/get-user-balance', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Unauthorized');
    }

    const data = await response.json();
    state.currentUser = data;

    // Update profile avatar if available
    if (data.profile_picture_url) {
      document.getElementById('profileBtn').querySelector('img').src = data.profile_picture_url;
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
  }
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
  // Navigation buttons
  document.getElementById('homeBtn')?.addEventListener('click', () => {
    window.location.href = '/fil.html';
  });

  document.getElementById('exploreBtn')?.addEventListener('click', () => {
    window.location.href = '/decouvrir.html';
  });

  document.getElementById('createBtn')?.addEventListener('click', () => {
    window.location.href = '/publier.html';
  });

  document.getElementById('notificationsBtn')?.addEventListener('click', () => {
    window.location.href = '/notifications.html';
  });

  document.getElementById('profileBtn')?.addEventListener('click', () => {
    window.location.href = '/profil.html';
  });

  // Feed tabs
  document.querySelectorAll('.feed-tab').forEach(tab => {
    tab.addEventListener('click', async (e) => {
      const tabName = e.target.dataset.tab;
      switchTab(tabName);
    });
  });

  // Infinite scroll
  window.addEventListener('scroll', () => {
    if (isNearBottom() && !state.loading && state.hasMore) {
      loadMorePosts();
    }
  });

  // Modal close
  document.getElementById('modalOverlay')?.addEventListener('click', closeModal);
  document.getElementById('modalClose')?.addEventListener('click', closeModal);
}

function switchTab(tabName) {
  // Update UI
  document.querySelectorAll('.feed-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  // Reset and reload
  state.currentTab = tabName;
  state.posts = [];
  state.page = 1;
  state.hasMore = true;

  document.getElementById('postsContainer').innerHTML = '';
  loadPosts();
}

function isNearBottom() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  return scrollTop + windowHeight >= documentHeight - 500;
}

// ============================================
// Stories
// ============================================

async function loadStories() {
  // Mock stories data for now
  const mockStories = [
    {
      id: '1',
      user: {
        username: 'montreal_vibes',
        profile_picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=montreal'
      }
    },
    {
      id: '2',
      user: {
        username: 'quebec_food',
        profile_picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=food'
      }
    },
    {
      id: '3',
      user: {
        username: 'laval_arts',
        profile_picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arts'
      }
    }
  ];

  const container = document.getElementById('storiesContainer');
  container.innerHTML = mockStories.map(story => `
    <div class="story-item" data-story-id="${story.id}">
      <div class="story-avatar">
        <img src="${story.user.profile_picture_url}" alt="${story.user.username}">
      </div>
      <span class="story-username">${story.user.username}</span>
    </div>
  `).join('');

  // Add click handlers
  document.querySelectorAll('.story-item').forEach(item => {
    item.addEventListener('click', () => {
      const storyId = item.dataset.storyId;
      openStory(storyId);
    });
  });
}

function openStory(storyId) {
  // TODO: Implement story viewer
  console.log('Opening story:', storyId);
}

// ============================================
// Posts Feed
// ============================================

async function loadPosts() {
  if (state.loading) return;

  state.loading = true;
  showLoading(true);

  try {
    // Mock posts data for demonstration
    const mockPosts = generateMockPosts(10);

    state.posts.push(...mockPosts);
    renderPosts(mockPosts);

    state.page++;

    // Simulate pagination
    if (state.page > 3) {
      state.hasMore = false;
    }
  } catch (error) {
    console.error('Error loading posts:', error);
    showError('Erreur lors du chargement des publications');
  } finally {
    state.loading = false;
    showLoading(false);
  }
}

async function loadMorePosts() {
  await loadPosts();
}

function generateMockPosts(count) {
  const posts = [];
  const types = ['photo', 'video'];
  const regions = ['Montréal', 'Québec', 'Laval', 'Gatineau', 'Sherbrooke'];
  const users = [
    { username: 'montreal_style', display_name: 'Style Montréal', verified: true },
    { username: 'quebec_nature', display_name: 'Nature Québec', verified: false },
    { username: 'laval_food', display_name: 'Bouffe Laval', verified: true },
    { username: 'gatineau_arts', display_name: 'Arts Gatineau', verified: false },
    { username: 'sherbrooke_life', display_name: 'Vie Sherbrooke', verified: false }
  ];

  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];

    posts.push({
      id: `post-${Date.now()}-${i}`,
      type,
      user: {
        ...user,
        profile_picture_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
      },
      caption: `Belle journée à ${region}! 🍁 #Quebec #${region.replace(' ', '')}`,
      hashtags: ['Quebec', region.replace(' ', ''), 'Belle', 'Canada'],
      media_urls: [
        type === 'video'
          ? `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`
          : `https://picsum.photos/seed/${Date.now() + i}/800/800`
      ],
      thumbnail_url: type === 'video' ? `https://picsum.photos/seed/${Date.now() + i}/800/800` : null,
      region,
      location: `${region}, Québec`,
      likes_count: Math.floor(Math.random() * 10000),
      comments_count: Math.floor(Math.random() * 500),
      views_count: Math.floor(Math.random() * 50000),
      is_liked: Math.random() > 0.5,
      created_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
    });
  }

  return posts;
}

function renderPosts(posts) {
  const container = document.getElementById('postsContainer');

  posts.forEach(post => {
    const postElement = createPostElement(post);
    container.appendChild(postElement);
  });
}

function createPostElement(post) {
  const article = document.createElement('article');
  article.className = 'post-card';
  article.dataset.postId = post.id;

  const timeAgo = getTimeAgo(post.created_at);
  const verifiedBadge = post.user.verified ? `
    <svg class="verified-badge" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ` : '';

  article.innerHTML = `
    <div class="post-header">
      <div class="post-author">
        <img class="author-avatar" src="${post.user.profile_picture_url}" alt="${post.user.username}">
        <div class="author-info">
          <div class="author-name">
            <span>${post.user.display_name || post.user.username}</span>
            ${verifiedBadge}
          </div>
          <div class="author-meta">
            <span>${post.location}</span> · <span>${timeAgo}</span>
          </div>
        </div>
      </div>
      <button class="post-menu-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="12" cy="19" r="2"/>
        </svg>
      </button>
    </div>

    <div class="post-media" data-type="${post.type}">
      ${post.type === 'video' ? `
        <video preload="metadata" poster="${post.thumbnail_url}">
          <source src="${post.media_urls[0]}" type="video/mp4">
        </video>
        <div class="video-overlay">
          <div class="play-button">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      ` : `
        <img src="${post.media_urls[0]}" alt="Post image" loading="lazy">
      `}
    </div>

    <div class="post-actions">
      <button class="action-btn like-btn ${post.is_liked ? 'liked' : ''}" data-post-id="${post.id}">
        <svg viewBox="0 0 24 24" fill="${post.is_liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
        <span class="like-count">${formatCount(post.likes_count)}</span>
      </button>

      <button class="action-btn comment-btn" data-post-id="${post.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
        </svg>
        <span>${formatCount(post.comments_count)}</span>
      </button>

      <button class="action-btn share-btn" data-post-id="${post.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
        <span>Partager</span>
      </button>

      <button class="action-btn save-btn" data-post-id="${post.id}" style="margin-left: auto;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
        </svg>
      </button>
    </div>

    ${post.caption ? `
      <div class="post-caption">
        <p class="caption-text">${post.caption}</p>
        ${post.hashtags.length > 0 ? `
          <div class="caption-hashtags">
            ${post.hashtags.map(tag => `<span class="hashtag">#${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    ` : ''}

    <div class="post-timestamp">
      ${formatViews(post.views_count)} vues
    </div>
  `;

  // Add event listeners
  article.querySelector('.like-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLike(post.id, article);
  });

  article.querySelector('.comment-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openComments(post.id);
  });

  article.querySelector('.share-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    sharePost(post.id);
  });

  article.querySelector('.save-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    savePost(post.id);
  });

  // Video play/pause
  const video = article.querySelector('video');
  if (video) {
    article.querySelector('.post-media')?.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        article.querySelector('.video-overlay').style.display = 'none';
      } else {
        video.pause();
        article.querySelector('.video-overlay').style.display = 'flex';
      }
    });
  }

  // Open post modal on image click
  const image = article.querySelector('img');
  if (image) {
    image.addEventListener('click', () => openPostModal(post.id));
  }

  return article;
}

// ============================================
// Post Actions
// ============================================

async function toggleLike(postId, articleElement) {
  const likeBtn = articleElement.querySelector('.like-btn');
  const isLiked = likeBtn.classList.contains('liked');
  const likeCount = articleElement.querySelector('.like-count');
  const currentCount = parseInt(likeCount.textContent.replace(/[^0-9]/g, '')) || 0;

  // Optimistic UI update
  likeBtn.classList.toggle('liked');
  const svg = likeBtn.querySelector('svg');
  svg.setAttribute('fill', isLiked ? 'none' : 'currentColor');
  likeCount.textContent = formatCount(isLiked ? currentCount - 1 : currentCount + 1);

  try {
    // TODO: Make API call to toggle like
    // await fetch(`/.netlify/functions/toggle-like`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ postId })
    // });
  } catch (error) {
    console.error('Error toggling like:', error);
    // Revert on error
    likeBtn.classList.toggle('liked');
    svg.setAttribute('fill', isLiked ? 'currentColor' : 'none');
    likeCount.textContent = formatCount(currentCount);
  }
}

function openComments(postId) {
  console.log('Opening comments for post:', postId);
  // TODO: Open comments modal
}

function sharePost(postId) {
  console.log('Sharing post:', postId);
  // TODO: Implement share functionality
  if (navigator.share) {
    navigator.share({
      title: 'ZYEUTÉ',
      text: 'Regarde cette publication sur ZYEUTÉ!',
      url: `${window.location.origin}/post/${postId}`
    });
  }
}

function savePost(postId) {
  console.log('Saving post:', postId);
  // TODO: Implement save functionality
}

function openPostModal(postId) {
  console.log('Opening post modal:', postId);
  // TODO: Implement post modal
}

// ============================================
// Suggestions
// ============================================

async function loadSuggestions() {
  // Mock suggestions
  const mockSuggestions = [
    {
      username: 'montreal_food',
      display_name: 'Bouffe Montréal',
      followers_count: 15200,
      profile_picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=food'
    },
    {
      username: 'quebec_travel',
      display_name: 'Voyage Québec',
      followers_count: 8900,
      profile_picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=travel'
    },
    {
      username: 'laval_fitness',
      display_name: 'Fitness Laval',
      followers_count: 5600,
      profile_picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fitness'
    }
  ];

  const container = document.getElementById('suggestionsContainer');
  if (!container) return;

  container.innerHTML = mockSuggestions.map(user => `
    <div class="suggestion-item">
      <img class="suggestion-avatar" src="${user.profile_picture_url}" alt="${user.username}">
      <div class="suggestion-info">
        <span class="suggestion-name">${user.display_name}</span>
        <span class="suggestion-meta">${formatCount(user.followers_count)} abonnés</span>
      </div>
      <button class="follow-btn" data-username="${user.username}">Suivre</button>
    </div>
  `).join('');

  // Add follow button handlers
  container.querySelectorAll('.follow-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const username = e.target.dataset.username;
      await followUser(username, e.target);
    });
  });
}

async function followUser(username, button) {
  button.textContent = 'Suivi';
  button.disabled = true;
  button.style.opacity = '0.6';

  try {
    // TODO: Make API call to follow user
    console.log('Following user:', username);
  } catch (error) {
    console.error('Error following user:', error);
    button.textContent = 'Suivre';
    button.disabled = false;
    button.style.opacity = '1';
  }
}

// ============================================
// Trending Hashtags
// ============================================

async function loadTrending() {
  // Mock trending hashtags
  const mockTrending = [
    { tag: 'Montreal', posts_count: 125000 },
    { tag: 'Quebec', posts_count: 98000 },
    { tag: 'Hiver2025', posts_count: 45000 },
    { tag: 'PoutineLovers', posts_count: 32000 },
    { tag: 'NatureQuebec', posts_count: 28000 }
  ];

  const container = document.getElementById('trendingContainer');
  if (!container) return;

  container.innerHTML = mockTrending.map(item => `
    <div class="trending-item" data-tag="${item.tag}">
      <span class="trending-tag">#${item.tag}</span>
      <span class="trending-count">${formatCount(item.posts_count)} publications</span>
    </div>
  `).join('');

  // Add click handlers
  container.querySelectorAll('.trending-item').forEach(item => {
    item.addEventListener('click', () => {
      const tag = item.dataset.tag;
      searchHashtag(tag);
    });
  });
}

function searchHashtag(tag) {
  window.location.href = `/decouvrir.html?hashtag=${encodeURIComponent(tag)}`;
}

// ============================================
// Utility Functions
// ============================================

function formatCount(count) {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
}

function formatViews(count) {
  return formatCount(count);
}

function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  const intervals = {
    an: 31536000,
    mois: 2592000,
    semaine: 604800,
    jour: 86400,
    heure: 3600,
    minute: 60
  };

  for (const [name, secondsInInterval] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInInterval);
    if (interval >= 1) {
      return `il y a ${interval} ${name}${interval > 1 && name !== 'mois' ? 's' : ''}`;
    }
  }

  return 'à l\'instant';
}

function showLoading(show) {
  const loader = document.getElementById('loadingIndicator');
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
  }
}

function showError(message) {
  // TODO: Implement toast notification
  console.error(message);
}

function closeModal() {
  const modal = document.getElementById('postModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Export functions for use in other modules
export {
  checkAuth,
  toggleLike,
  openComments,
  sharePost,
  formatCount,
  getTimeAgo
};
