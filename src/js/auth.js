/**
 * AdGenXAI Authentication Page
 * Handles multiple authentication methods
 */

// Tab switching
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const tabName = button.dataset.tab;
    
    // Update buttons
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    button.classList.add('active');
    button.setAttribute('aria-selected', 'true');
    
    // Update panels
    tabPanels.forEach(panel => {
      panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-panel`).classList.add('active');
  });
});

/**
 * Show/hide loading state on button
 */
function setButtonLoading(button, loading) {
  const text = button.querySelector('.btn-text');
  const loadingSpan = button.querySelector('.btn-loading');
  
  if (loading) {
    text.style.display = 'none';
    loadingSpan.style.display = 'inline-flex';
    button.disabled = true;
  } else {
    text.style.display = 'inline';
    loadingSpan.style.display = 'none';
    button.disabled = false;
  }
}

/**
 * Handle OAuth authentication
 */
async function handleOAuth(provider) {
  try {
    const response = await fetch(`/.netlify/functions/auth-oauth-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ provider })
    });
    
    const data = await response.json();
    
    if (data.url) {
      // Redirect to OAuth provider
      window.location.href = data.url;
    } else {
      throw new Error('Failed to get OAuth URL');
    }
  } catch (error) {
    console.error('OAuth error:', error);
    window.showToast?.('Authentication failed. Please try again.', 'error');
  }
}

// Google OAuth
document.getElementById('google-auth')?.addEventListener('click', () => {
  handleOAuth('google');
});

// GitHub OAuth
document.getElementById('github-auth')?.addEventListener('click', () => {
  handleOAuth('github');
});

/**
 * Handle Magic Link authentication
 */
const magicLinkForm = document.getElementById('magic-link-form');
const magicLinkSubmit = document.getElementById('magic-link-submit');

magicLinkForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('magic-email').value;
  
  setButtonLoading(magicLinkSubmit, true);
  
  try {
    const response = await fetch('/.netlify/functions/auth-magic-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      window.showToast?.('Magic link sent! Check your email.', 'success');
      magicLinkForm.reset();
    } else {
      throw new Error(data.error || 'Failed to send magic link');
    }
  } catch (error) {
    console.error('Magic link error:', error);
    window.showToast?.(error.message || 'Failed to send magic link. Please try again.', 'error');
  } finally {
    setButtonLoading(magicLinkSubmit, false);
  }
});

/**
 * Handle Phone authentication
 */
const phoneForm = document.getElementById('phone-form');
const phoneSubmit = document.getElementById('phone-submit');
const otpVerification = document.getElementById('otp-verification');
const verifyOtpBtn = document.getElementById('verify-otp');

phoneForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const phone = document.getElementById('phone-number').value;
  
  setButtonLoading(phoneSubmit, true);
  
  try {
    const response = await fetch('/.netlify/functions/auth-phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      window.showToast?.('OTP sent to your phone!', 'success');
      phoneForm.style.display = 'none';
      otpVerification.style.display = 'block';
    } else {
      throw new Error(data.error || 'Failed to send OTP');
    }
  } catch (error) {
    console.error('Phone auth error:', error);
    window.showToast?.(error.message || 'Failed to send OTP. Please try again.', 'error');
  } finally {
    setButtonLoading(phoneSubmit, false);
  }
});

verifyOtpBtn?.addEventListener('click', async () => {
  const phone = document.getElementById('phone-number').value;
  const otp = document.getElementById('otp-code').value;
  
  if (!otp || otp.length !== 6) {
    window.showToast?.('Please enter a valid 6-digit code', 'error');
    return;
  }
  
  verifyOtpBtn.disabled = true;
  verifyOtpBtn.textContent = 'Verifying...';
  
  try {
    const response = await fetch('/.netlify/functions/auth-phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone, otp, verify: true })
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      localStorage.setItem('token', data.token);
      window.showToast?.('Successfully signed in!', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
    } else {
      throw new Error(data.error || 'Invalid OTP code');
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    window.showToast?.(error.message || 'Failed to verify OTP. Please try again.', 'error');
  } finally {
    verifyOtpBtn.disabled = false;
    verifyOtpBtn.textContent = 'Verify Code';
  }
});

/**
 * Handle Password authentication
 */
const passwordForm = document.getElementById('password-form');
const passwordSubmit = document.getElementById('password-submit');

passwordForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('password-email').value;
  const password = document.getElementById('password').value;
  
  setButtonLoading(passwordSubmit, true);
  
  try {
    const response = await fetch('/.netlify/functions/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      localStorage.setItem('token', data.token);
      window.showToast?.('Successfully signed in!', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
    } else {
      throw new Error(data.error || 'Invalid credentials');
    }
  } catch (error) {
    console.error('Password auth error:', error);
    window.showToast?.(error.message || 'Failed to sign in. Please check your credentials.', 'error');
  } finally {
    setButtonLoading(passwordSubmit, false);
  }
});

/**
 * Check for OAuth callback
 */
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

if (code && state) {
  // Handle OAuth callback
  window.showToast?.('Completing authentication...', 'info');
  
  fetch('/.netlify/functions/auth-oauth-callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code, state })
  })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('token', data.token);
        window.showToast?.('Successfully signed in!', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1000);
      } else {
        throw new Error('Authentication failed');
      }
    })
    .catch(error => {
      console.error('OAuth callback error:', error);
      window.showToast?.('Authentication failed. Please try again.', 'error');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    });
}
