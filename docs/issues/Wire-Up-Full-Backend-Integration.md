# Issue: Wire Up Full Backend Integration - Authentication, Generation, Export & Payments

@codex - CRITICAL: Complete Functional Backend Integration

## Overview
The design is perfect and branding is correct, but NOTHING is functional yet. All buttons, forms, and features need to be connected to the existing Netlify functions.

## Priority 1: Authentication System

### A. Signup Page (src/signup.html)
Add this JavaScript at the bottom of the file:

```
document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  if (!signupForm) return;
  
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';
    
    try {
      const response = await fetch('/.netlify/functions/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard.html';
      } else {
        showToast(data.error || 'Signup failed. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
      }
    } catch (error) {
      console.error('Signup error:', error);
      showToast('Signup failed. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign Up';
    }
  });
});
```

### B. Login Page (src/login.html)
Add this JavaScript:

```
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    try {
      const response = await fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard.html';
      } else {
        showToast(data.error || 'Login failed. Please check your credentials.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Login failed. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  });
});
```

### C. Magic Link Auth (src/auth.html)
Add magic link functionality:

```
document.addEventListener('DOMContentLoaded', () => {
  const magicLinkBtn = document.getElementById('magic-link-btn');
  if (!magicLinkBtn) return;
  
  magicLinkBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    
    if (!email) {
      showToast('Please enter your email address', 'info');
      return;
    }
    
    magicLinkBtn.disabled = true;
    magicLinkBtn.textContent = 'Sending...';
    
    try {
      const response = await fetch('/.netlify/functions/auth-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Magic link sent! Check your email.', 'success');
      } else {
        showToast(data.error || 'Failed to send magic link', 'error');
      }
    } catch (error) {
      console.error('Magic link error:', error);
      showToast('Failed to send magic link. Please try again.', 'error');
    } finally {
      magicLinkBtn.disabled = false;
      magicLinkBtn.textContent = 'Send Magic Link';
    }
  });
});
```

## Priority 2: Dashboard Integration

### Dashboard (src/dashboard.html)
Add full dashboard functionality:

```
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  
  // Load dashboard data
  try {
    // Get user balance
    const balanceRes = await fetch('/.netlify/functions/get-user-balance', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const balanceData = await balanceRes.json();
    
    // Update token balance in UI
    const tokenBalanceEl = document.getElementById('token-balance');
    if (tokenBalanceEl) {
      tokenBalanceEl.textContent = balanceData.balance || 0;
    }
    
    // Get generation history
    const historyRes = await fetch('/.netlify/functions/get-generations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const historyData = await historyRes.json();
    
    // Display generation history
    const historyContainer = document.getElementById('generation-history');
    if (historyContainer && historyData.generations) {
      historyContainer.innerHTML = historyData.generations.map(gen => `
        <div class="generation-item glass-card">
          <h4>${gen.format} - ${gen.style}</h4>
          <p>${gen.topic}</p>
          <small>${new Date(gen.created_at).toLocaleDateString()}</small>
        </div>
      `).join('');
    }
    
    // Update stats
    const totalGenEl = document.getElementById('total-generations');
    const exportsEl = document.getElementById('exports-count');
    
    if (totalGenEl) totalGenEl.textContent = historyData.total || 0;
    if (exportsEl) exportsEl.textContent = historyData.exports || 0;
    
  } catch (error) {
    console.error('Dashboard load error:', error);
    showToast('Failed to load dashboard data', 'error');
  }
  
  // Logout functionality
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });
  }
});
```

## Priority 3: Content Generation

### Create Page (src/create.html)
Wire up LongCat and Emu generation:

```
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  
  // LongCat Generation
  const longcatBtn = document.getElementById('generate-longcat-btn');
  if (longcatBtn) {
    longcatBtn.addEventListener('click', async () => {
      const topic = document.getElementById('topic').value;
      const style = document.getElementById('style').value;
      
      if (!topic) {
        showToast('Please enter a topic', 'info');
        return;
      }
      
      longcatBtn.disabled = true;
      longcatBtn.textContent = 'Generating...';
      
      try {
        const response = await fetch('/.netlify/functions/generate-longcat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ topic, style })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Display generated content
          const outputEl = document.getElementById('output');
          const outputSection = document.getElementById('output-section');
          
          if (outputEl) outputEl.textContent = data.content;
          if (outputSection) outputSection.style.display = 'block';
          
          // Update token balance
          const tokensEl = document.getElementById('tokens-remaining');
          if (tokensEl) tokensEl.textContent = data.tokensRemaining;
          
          showToast('Content generated successfully!', 'success');
        } else {
          showToast(data.error || 'Generation failed', 'error');
        }
      } catch (error) {
        console.error('Generation error:', error);
        showToast('Generation failed. Please try again.', 'error');
      } finally {
        longcatBtn.disabled = false;
        longcatBtn.textContent = 'Generate LongCat';
      }
    });
  }
  
  // Emu Generation (similar pattern)
  const emuBtn = document.getElementById('generate-emu-btn');
  if (emuBtn) {
    emuBtn.addEventListener('click', async () => {
      const topic = document.getElementById('topic').value;
      const style = document.getElementById('style').value;
      
      if (!topic) {
        showToast('Please enter a topic', 'info');
        return;
      }
      
      emuBtn.disabled = true;
      emuBtn.textContent = 'Generating...';
      
      try {
        const response = await fetch('/.netlify/functions/generate-emu', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ topic, style })
        });
        
        const data = await response.json();
        
        if (data.success) {
          const outputEl = document.getElementById('output');
          const outputSection = document.getElementById('output-section');
          
          if (outputEl) outputEl.textContent = data.content;
          if (outputSection) outputSection.style.display = 'block';
          
          const tokensEl = document.getElementById('tokens-remaining');
          if (tokensEl) tokensEl.textContent = data.tokensRemaining;
          
          showToast('Content generated successfully!', 'success');
        } else {
          showToast(data.error || 'Generation failed', 'error');
        }
      } catch (error) {
        console.error('Generation error:', error);
        showToast('Generation failed. Please try again.', 'error');
      } finally {
        emuBtn.disabled = false;
        emuBtn.textContent = 'Generate Emu';
      }
    });
  }
});
```

## Priority 4: Export Functionality

### Export Integration
Add export handlers to create.html:

```
// Instagram Export
const instagramBtn = document.getElementById('export-instagram-btn');
if (instagramBtn) {
  instagramBtn.addEventListener('click', async () => {
    const content = document.getElementById('generated-content').value;
    if (!content) {
      showToast('No content to export', 'info');
      return;
    }
    
    try {
      const response = await fetch('/.netlify/functions/export-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const outputEl = document.getElementById('instagram-output');
        if (outputEl) {
          outputEl.textContent = data.formatted;
          const copyBtn = document.getElementById('copy-btn');
          if (copyBtn) copyBtn.style.display = 'block';
        }
        showToast('Exported for Instagram!', 'success');
      }
    } catch (error) {
      console.error('Export error:', error);
      showToast('Export failed', 'error');
    }
  });
}

// Copy to clipboard
const copyBtn = document.getElementById('copy-btn');
if (copyBtn) {
  copyBtn.addEventListener('click', () => {
    const text = document.getElementById('instagram-output').textContent;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!', 'success');
    });
  });
}
```

## Priority 5: Stripe Payments

### Pricing Page Integration (src/pricing.html)
Wire up all "Get Started" and "Choose Plan" buttons:

```
document.addEventListener('DOMContentLoaded', () => {
  // Find all pricing buttons
  const pricingButtons = document.querySelectorAll('.pricing-card .btn');
  
  pricingButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Determine which plan based on the card
      const card = btn.closest('.pricing-card');
      const badge = card.querySelector('.pricing-badge');
      let plan = 'pro'; // default
      
      if (badge) {
        const badgeText = badge.textContent.toLowerCase();
        if (badgeText.includes('starter')) plan = 'starter';
        else if (badgeText.includes('enterprise')) plan = 'enterprise';
      }
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login.html?redirect=/pricing.html';
        return;
      }
      
      btn.disabled = true;
      btn.textContent = 'Loading...';
      
      try {
        const response = await fetch('/.netlify/functions/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ plan })
        });
        
        const data = await response.json();
        
        if (data.url) {
          // Redirect to Stripe Checkout
          window.location.href = data.url;
        } else {
          showToast('Failed to create checkout session', 'error');
          btn.disabled = false;
          btn.textContent = 'Get Started';
        }
      } catch (error) {
        console.error('Checkout error:', error);
        showToast('Checkout failed. Please try again.', 'error');
        btn.disabled = false;
        btn.textContent = 'Get Started';
      }
    });
  });
});
```

## Priority 6: Global Navigation & Auth State

### Create new file: src/js/auth-check.js

```
// Global auth state management
function checkAuthState() {
  const token = localStorage.getItem('token');
  const protectedPages = [
    '/dashboard.html',
    '/create.html',
    '/creator.html'
  ];
  
  // If on a protected page without token, redirect to login
  const currentPath = window.location.pathname;
  if (protectedPages.includes(currentPath) && !token) {
    window.location.href = `/login.html?redirect=${currentPath}`;
  }
  
  // Update nav buttons based on auth state
  const navCta = document.querySelector('.nav-cta');
  if (navCta && token) {
    navCta.innerHTML = `
      <a href="/dashboard.html" class="btn btn-glass">Dashboard</a>
      <button id="logout-btn" class="btn btn-primary">Logout</button>
    `;
    
    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/';
    });
  }
}

// Run on every page load
document.addEventListener('DOMContentLoaded', checkAuthState);
```

### Update ALL HTML files
Add this script tag before closing `</body>`:

```
<script src="/js/auth-check.js"></script>
```

## Priority 7: Error Handling & UX Polish

### Create src/js/toast-notifications.js

```
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Replace all alert() calls with showToast()
window.showToast = showToast;
```

### Add CSS for toasts in src/css/global.css

```
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
}

.toast {
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 10px;
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.toast.show {
  opacity: 1;
  transform: translateX(0);
}

.toast-success {
  background: rgba(16, 185, 129, 0.9);
}

.toast-error {
  background: rgba(239, 68, 68, 0.9);
}

.toast-info {
  background: rgba(59, 130, 246, 0.9);
}
```

## Testing Checklist

- [ ] User can sign up with email/password
- [ ] User receives verification (if applicable)
- [ ] User can log in
- [ ] Magic link auth works
- [ ] Dashboard loads user data correctly
- [ ] Token balance displays
- [ ] LongCat generation works
- [ ] Emu generation works
- [ ] Token balance decreases after generation
- [ ] Instagram export works
- [ ] YouTube export works
- [ ] TikTok export works
- [ ] Copy to clipboard works
- [ ] All 3 pricing plans redirect to Stripe correctly
- [ ] Stripe checkout completes
- [ ] Tokens are added after purchase
- [ ] Logout works
- [ ] Protected pages redirect to login
- [ ] Navigation updates based on auth state
- [ ] All buttons have proper loading states
- [ ] Error messages display correctly
- [ ] Success messages display correctly

## Files That Need Updates

1. `src/signup.html` - Add signup handler
2. `src/login.html` - Add login handler
3. `src/auth.html` - Add magic link handler
4. `src/dashboard.html` - Add dashboard loader
5. `src/create.html` - Add generation & export handlers
6. `src/pricing.html` - Add Stripe checkout handlers
7. `src/js/auth-check.js` - CREATE NEW FILE
8. `src/js/toast-notifications.js` - CREATE NEW FILE
9. `src/css/global.css` - Add toast styles

## Notes

- All Netlify functions already exist in `/netlify/functions/`
- Just need to wire up frontend to call these functions
- Use proper error handling and loading states
- Replace all `alert()` with toast notifications
- Add proper accessibility (ARIA labels, focus management)

Please implement these changes and test thoroughly before creating a PR!
