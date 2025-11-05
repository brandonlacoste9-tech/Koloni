// Dashboard JavaScript for statistics and animations

// Mobile navigation toggle (shared)
const initMobileNav = () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
      
      const hamburger = navToggle.querySelector('.hamburger');
      hamburger.classList.toggle('active');
      
      if (window.innerWidth < 768) {
        if (navMenu.style.display === 'flex') {
          navMenu.style.position = 'fixed';
          navMenu.style.top = 'var(--header-height)';
          navMenu.style.left = '0';
          navMenu.style.right = '0';
          navMenu.style.background = 'var(--background)';
          navMenu.style.flexDirection = 'column';
          navMenu.style.padding = 'var(--spacing-lg)';
          navMenu.style.borderBottom = '1px solid var(--surface-light)';
        }
      }
    });
  }
};

// Animate statistics counter
const animateCounter = (element, target, duration = 2000) => {
  let start = 0;
  const increment = target / (duration / 16);
  
  const updateCounter = () => {
    start += increment;
    if (start < target) {
      element.textContent = Math.floor(start).toLocaleString();
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = target.toLocaleString();
    }
  };
  
  updateCounter();
};

// Initialize dashboard statistics
const initDashboardStats = () => {
  const stats = {
    artifacts: 1247,
    sealed: 1189,
    users: 342,
    operations: 8956
  };
  
  // Animate stats on load
  Object.entries(stats).forEach(([key, value]) => {
    const element = document.querySelector(`[data-stat="${key}"]`);
    if (element) {
      // Delay animation slightly for staggered effect
      setTimeout(() => {
        animateCounter(element, value);
      }, 300);
    }
  });
};

// Real-time updates simulation
const simulateRealTimeUpdates = () => {
  setInterval(() => {
    const stats = ['artifacts', 'sealed', 'users', 'operations'];
    const randomStat = stats[Math.floor(Math.random() * stats.length)];
    const element = document.querySelector(`[data-stat="${randomStat}"]`);
    
    if (element) {
      const currentValue = parseInt(element.textContent.replace(/,/g, ''));
      const newValue = currentValue + Math.floor(Math.random() * 5) + 1;
      
      // Subtle animation
      element.style.transform = 'scale(1.1)';
      element.style.transition = 'transform 0.3s ease';
      
      setTimeout(() => {
        element.textContent = newValue.toLocaleString();
        element.style.transform = 'scale(1)';
      }, 150);
    }
  }, 10000); // Update every 10 seconds
};

// Chart bar hover effects
const initChartInteractions = () => {
  const chartBars = document.querySelectorAll('.chart-bar');
  
  chartBars.forEach((bar, index) => {
    bar.addEventListener('mouseenter', () => {
      // Show tooltip or highlight
      bar.style.opacity = '1';
      bar.style.filter = 'brightness(1.2)';
    });
    
    bar.addEventListener('mouseleave', () => {
      bar.style.opacity = '';
      bar.style.filter = '';
    });
  });
};

// Activity card animations
const initActivityAnimations = () => {
  const activityCards = document.querySelectorAll('.activity-card');
  
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 100); // Stagger animation
      }
    });
  }, observerOptions);
  
  activityCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.5s ease-out';
    observer.observe(card);
  });
};

// Header scroll effect
const initHeaderScroll = () => {
  const header = document.querySelector('.header');
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      header.style.boxShadow = 'var(--shadow-lg)';
    } else {
      header.style.boxShadow = 'none';
    }
  });
};

// Stat cards hover effect
const initStatCardEffects = () => {
  const statCards = document.querySelectorAll('.stat-card');
  
  statCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.background = 'linear-gradient(135deg, var(--surface), var(--surface-light))';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.background = 'var(--surface)';
    });
  });
};

// Initialize all dashboard functionality
const init = () => {
  initMobileNav();
  initDashboardStats();
  initChartInteractions();
  initActivityAnimations();
  initHeaderScroll();
  initStatCardEffects();
  
  // Start real-time updates after initial load
  setTimeout(() => {
    simulateRealTimeUpdates();
  }, 3000);
};

// Run on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
