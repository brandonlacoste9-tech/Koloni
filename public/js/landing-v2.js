// Landing V2 - Advanced Animations & Interactions

document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll navigation
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // GSAP Animations - Hero Section
  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Hero Title Animation
    gsap.from('.hero-title', {
      duration: 1,
      y: 40,
      opacity: 0,
      delay: 0.2,
      ease: 'power3.out'
    });

    // Hero Subtitle Animation
    gsap.from('.hero-subtitle', {
      duration: 1,
      y: 30,
      opacity: 0,
      delay: 0.4,
      ease: 'power3.out'
    });

    // CTA Buttons Animation
    gsap.from('.hero-cta-group', {
      duration: 1,
      y: 20,
      opacity: 0,
      delay: 0.6,
      ease: 'power3.out'
    });

    // Hero Badge Animation
    gsap.from('.hero-badge', {
      duration: 0.8,
      y: 10,
      opacity: 0,
      delay: 0.1,
      ease: 'power2.out'
    });

    // Visual Card Animation
    gsap.from('.visual-card', {
      duration: 1.2,
      x: 100,
      opacity: 0,
      delay: 0.3,
      ease: 'power3.out'
    });

    // Features Stagger Animation
    gsap.from('.feature-item', {
      duration: 0.8,
      y: 30,
      opacity: 0,
      stagger: 0.1,
      scrollTrigger: {
        trigger: '.features',
        start: 'top 80%',
        end: 'top 20%',
        toggleActions: 'play none none reverse'
      },
      ease: 'power2.out'
    });

    // Pricing Cards Animation
    gsap.from('.pricing-card', {
      duration: 0.8,
      y: 30,
      opacity: 0,
      stagger: 0.15,
      scrollTrigger: {
        trigger: '.pricing',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      ease: 'power2.out'
    });

    // Step Cards Animation
    gsap.from('.step-card', {
      duration: 0.8,
      y: 30,
      opacity: 0,
      stagger: 0.2,
      scrollTrigger: {
        trigger: '.how-it-works',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      ease: 'power2.out'
    });
  }

  // Hover Effects on Cards
  document.querySelectorAll('.glass-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
      if (typeof gsap !== 'undefined') {
        gsap.to(this, {
          duration: 0.3,
          boxShadow: '0 30px 80px rgba(255, 193, 7, 0.2)'
        });
      }
    });

    card.addEventListener('mouseleave', function() {
      if (typeof gsap !== 'undefined') {
        gsap.to(this, {
          duration: 0.3,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        });
      }
    });
  });

  // Pricing Card Highlight on Hover
  document.querySelectorAll('.pricing-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
      if (!this.classList.contains('pricing-featured')) {
        gsap.to(this, { duration: 0.3, opacity: 0.7 });
      }
    });

    card.addEventListener('mouseleave', function() {
      if (!this.classList.contains('pricing-featured')) {
        gsap.to(this, { duration: 0.3, opacity: 1 });
      }
    });
  });

  // Button Ripple Effect
  document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.width = '0';
      ripple.style.height = '0';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, 0.5)';
      ripple.style.pointerEvents = 'none';
      ripple.style.transform = 'translate(-50%, -50%)';

      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);

      if (typeof gsap !== 'undefined') {
        gsap.to(ripple, {
          duration: 0.6,
          width: 300,
          height: 300,
          opacity: 0,
          onComplete: () => ripple.remove()
        });
      }
    });
  });

  // Navbar Background on Scroll
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.style.borderBottom = '1px solid rgba(255, 193, 7, 0.2)';
    } else {
      navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
    }
  });

  // Parallax Effect on Hero Orbs
  window.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    document.querySelectorAll('.gradient-orb').forEach((orb, index) => {
      const offset = (index + 1) * 50;
      if (typeof gsap !== 'undefined') {
        gsap.to(orb, {
          duration: 1,
          x: mouseX * offset,
          y: mouseY * offset,
          ease: 'power2.out'
        });
      }
    });
  });

  // Counter Animation for Stats
  const animateCounters = () => {
    document.querySelectorAll('.stat-number').forEach(stat => {
      const value = stat.textContent;
      
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(stat, 
          { textContent: 0 },
          {
            duration: 2,
            textContent: value,
            snap: { textContent: 1 },
            scrollTrigger: {
              trigger: stat,
              start: 'top 80%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }
    });
  };

  animateCounters();

  console.log('🐝 Koloni Landing V2 Loaded - Premium 2025 Design');
});