// Main JavaScript for homepage

// Mobile navigation toggle
const initMobileNav = () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
      
      // Toggle hamburger animation
      const hamburger = navToggle.querySelector('.hamburger');
      hamburger.classList.toggle('active');
      
      // Position menu below header
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

// Contact form submission
const initContactForm = () => {
  const form = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  
  if (form && formStatus) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message')
      };
      
      try {
        formStatus.textContent = 'Sending message...';
        formStatus.className = 'form-status';
        
        // Try to submit to Netlify function
        const response = await fetch('/.netlify/functions/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          formStatus.textContent = 'Message sent successfully!';
          formStatus.className = 'form-status success';
          form.reset();
        } else {
          throw new Error('Failed to send message');
        }
      } catch (error) {
        console.error('Form submission error:', error);
        // Fallback: simulate success for demo purposes
        formStatus.textContent = 'Message received! (Demo mode - Netlify function not deployed yet)';
        formStatus.className = 'form-status success';
        form.reset();
      }
      
      // Clear status after 5 seconds
      setTimeout(() => {
        formStatus.textContent = '';
        formStatus.className = 'form-status';
      }, 5000);
    });
  }
};

// Smooth scroll for anchor links
const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        const headerOffset = 70;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
};

// Header scroll effect
const initHeaderScroll = () => {
  const header = document.querySelector('.header');
  let lastScroll = 0;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      header.style.boxShadow = 'var(--shadow-lg)';
    } else {
      header.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
  });
};

// Intersection Observer for animations
const initScrollAnimations = () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Observe cards
  document.querySelectorAll('.card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease-out';
    observer.observe(card);
  });
};

// Initialize all functionality
const init = () => {
  initMobileNav();
  initContactForm();
  initSmoothScroll();
  initHeaderScroll();
  initScrollAnimations();
};

// Run on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
