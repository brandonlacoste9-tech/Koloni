import { gsap } from 'gsap';

export default function Nav() {
  const initNavAnimations = () => {
    // Subtle float on logo
    gsap.to('.nav-logo', {
      y: -2,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    // Hover glow on links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('mouseenter', () => {
        gsap.to(link, { color: '#ffd54f', duration: 0.3, ease: 'power2.out' });
      });
      link.addEventListener('mouseleave', () => {
        gsap.to(link, { color: '#e5e5e5', duration: 0.3, ease: 'power2.out' });
      });
    });

    // Mobile menu slide
    const mobileBtn = document.querySelector('.nav-toggle');
    const mobileMenu = document.querySelector('.nav-mobile-menu');
    if (mobileBtn && mobileMenu) {
      mobileBtn.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('active');
        gsap.to(mobileMenu, {
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
          duration: 0.4,
          ease: 'power2.out'
        });
      });
    }
  };

  return `
    <nav class="nav">
      <div class="container">
        <div class="nav-brand">
          <a href="/" class="nav-logo">
            <span class="text-gradient">Koloni</span>
          </a>
        </div>
        <ul class="nav-menu">
          <li><a href="/about" class="nav-link">About</a></li>
          <li><a href="/features" class="nav-link">Features</a></li>
          <li><a href="/dashboard" class="nav-link">Dashboard</a></li>
          <li><a href="/community" class="nav-link">Community</a></li>
        </ul>
        <div class="nav-cta">
          <a href="/login" class="btn btn-glass">Login</a>
          <a href="/signup" class="btn btn-primary">Sign Up</a>
        </div>
        <button class="nav-toggle" aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul class="nav-mobile-menu">
          <li><a href="/about" class="nav-link">About</a></li>
          <li><a href="/features" class="nav-link">Features</a></li>
          <li><a href="/dashboard" class="nav-link">Dashboard</a></li>
          <li><a href="/community" class="nav-link">Community</a></li>
          <li><a href="/login" class="btn btn-glass">Login</a></li>
          <li><a href="/signup" class="btn btn-primary">Sign Up</a></li>
        </ul>
      </div>
      <!-- Subtle honeycomb accent -->
      <div class="nav-honeycomb-accent"></div>
      <script>
        (() => {
          if(typeof gsap !== 'undefined') {
            ${initNavAnimations.toString()}
            initNavAnimations();
          }
        })();
      </script>
    </nav>
  `;
}