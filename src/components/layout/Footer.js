export default function Footer() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3 class="text-gradient">Koloni</h3>
            <p>Building connected communities in harmony.</p>
          </div>
          <div class="footer-links">
            <h4>Product</h4>
            <ul>
              <li><a href="/features">Features</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
              <li><a href="/pricing">Pricing</a></li>
            </ul>
          </div>
          <div class="footer-links">
            <h4>Company</h4>
            <ul>
              <li><a href="/about">About</a></li>
              <li><a href="/careers">Careers</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
          <div class="footer-newsletter">
            <h4>Stay Connected</h4>
            <p>Join our colony for updates.</p>
            <form class="newsletter-form">
              <input type="email" placeholder="Your email" aria-label="Email for newsletter">
              <button type="submit" class="btn btn-primary">Subscribe</button>
            </form>
          </div>
        </div>
        <div class="footer-bottom">
          <div class="footer-honeycomb-border"></div>
          <p>&copy; 2025 Koloni. All rights reserved.</p>
          <div class="footer-social">
            <a href="/twitter" aria-label="Twitter">🐝</a>
            <a href="/discord" aria-label="Discord">📱</a>
            <a href="/github" aria-label="GitHub">🔗</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}