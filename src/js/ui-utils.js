/**
 * AdGenXAI UI Utilities
 * Handles dark mode, toast notifications, and common UI interactions
 */

// ==========================================
// DARK MODE TOGGLE
// ==========================================
(function initDarkMode() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (!darkModeToggle) return;

  // Check for saved theme preference or default to dark mode
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  darkModeToggle.setAttribute('aria-pressed', currentTheme === 'dark');

  // Toggle dark mode
  darkModeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    darkModeToggle.setAttribute('aria-pressed', newTheme === 'dark');
    
    // Announce to screen readers
    announceToScreenReader(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode activated`);
  });
})();

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
const Toast = {
  container: null,
  
  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      this.container.setAttribute('role', 'region');
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(this.container);
    }
  },
  
  show(message, type = 'info', duration = 5000) {
    this.init();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    
    const icon = this.getIcon(type);
    
    toast.innerHTML = `
      <span aria-hidden="true" style="font-size: 1.5rem;">${icon}</span>
      <div class="toast-content">
        <div class="toast-title">${this.getTitle(type)}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close notification">✕</button>
    `;
    
    this.container.appendChild(toast);
    
    // Close button handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.remove(toast));
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }
    
    // Announce to screen readers
    announceToScreenReader(message);
    
    return toast;
  },
  
  remove(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  },
  
  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  },
  
  getTitle(type) {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info'
    };
    return titles[type] || titles.info;
  },
  
  success(message, duration) {
    return this.show(message, 'success', duration);
  },
  
  error(message, duration) {
    return this.show(message, 'error', duration);
  },
  
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  },
  
  info(message, duration) {
    return this.show(message, 'info', duration);
  }
};

// Make Toast globally available
window.Toast = Toast;

// ==========================================
// SCREEN READER ANNOUNCEMENTS
// ==========================================
function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

window.announceToScreenReader = announceToScreenReader;

// ==========================================
// LOADING STATES
// ==========================================
function setButtonLoading(button, loading = true) {
  if (loading) {
    button.classList.add('btn-loading');
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = 'Loading...';
  } else {
    button.classList.remove('btn-loading');
    button.disabled = false;
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

window.setButtonLoading = setButtonLoading;

// ==========================================
// LAZY LOADING IMAGES
// ==========================================
(function initLazyLoading() {
  const images = document.querySelectorAll('img[loading="lazy"]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for browsers without IntersectionObserver
    images.forEach(img => img.classList.add('loaded'));
  }
})();

// ==========================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ==========================================
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '#!') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Set focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus();
      }
    });
  });
})();

// ==========================================
// FORM VALIDATION HELPERS
// ==========================================
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  return password.length >= 8;
}

function showFieldError(fieldId, message) {
  const errorElement = document.getElementById(`${fieldId}-error`);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.setAttribute('aria-invalid', 'true');
  }
}

function clearFieldError(fieldId) {
  const errorElement = document.getElementById(`${fieldId}-error`);
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.removeAttribute('aria-invalid');
  }
}

window.validateEmail = validateEmail;
window.validatePassword = validatePassword;
window.showFieldError = showFieldError;
window.clearFieldError = clearFieldError;

// ==========================================
// KEYBOARD NAVIGATION ENHANCEMENTS
// ==========================================
(function initKeyboardNav() {
  // Trap focus in modals when they're open
  document.addEventListener('keydown', (e) => {
    // Close modal/overlay on Escape key
    if (e.key === 'Escape') {
      const overlay = document.querySelector('.glass-overlay.active');
      if (overlay) {
        overlay.classList.remove('active');
      }
    }
  });
  
  // Add visible focus indicators for keyboard users
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });
  
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });
})();

// ==========================================
// PARALLAX EFFECTS
// ==========================================
(function initParallax() {
  const parallaxElements = document.querySelectorAll('.parallax-layer');
  
  if (parallaxElements.length === 0) return;
  
  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;
  
  let ticking = false;
  
  function updateParallax() {
    const scrolled = window.pageYOffset;
    
    parallaxElements.forEach((el) => {
      const speed = el.dataset.parallaxSpeed || 0.5;
      const yPos = -(scrolled * speed);
      el.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });
    
    ticking = false;
  }
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  });
})();

// ==========================================
// PAGE VISIBILITY FOR PERFORMANCE
// ==========================================
(function initPageVisibility() {
  let hidden, visibilityChange;
  
  if (typeof document.hidden !== 'undefined') {
    hidden = 'hidden';
    visibilityChange = 'visibilitychange';
  } else if (typeof document.msHidden !== 'undefined') {
    hidden = 'msHidden';
    visibilityChange = 'msvisibilitychange';
  } else if (typeof document.webkitHidden !== 'undefined') {
    hidden = 'webkitHidden';
    visibilityChange = 'webkitvisibilitychange';
  }
  
  if (typeof document[hidden] !== 'undefined') {
    document.addEventListener(visibilityChange, () => {
      if (document[hidden]) {
        // Page is hidden - pause animations, stop timers, etc.
        document.body.classList.add('page-hidden');
      } else {
        // Page is visible - resume animations
        document.body.classList.remove('page-hidden');
      }
    });
  }
})();

// ==========================================
// CONSOLE MESSAGE
// ==========================================
console.log(
  '%c🚀 AdGenXAI',
  'font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #f59e0b, #06b6d4); -webkit-background-clip: text; color: transparent;'
);
console.log(
  '%cUI Enhancement System Loaded',
  'font-size: 14px; color: #06b6d4;'
);
