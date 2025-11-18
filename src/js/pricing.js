/**
 * AdGenXAI Pricing Page
 * Handles Stripe checkout integration
 */

// Initialize Stripe
const stripe = Stripe(window.location.hostname === 'localhost' 
  ? 'pk_test_51QSwfeJO07cGjATOXbBB9yFVwGkbMlTVXrBw8Kt8mxLXVsVYfGHZdLYnTYVJVxS6aL8LBxDuCDhGzKGHXN49Zgmc00NM8qTnFg'
  : 'pk_live_YOUR_LIVE_KEY_HERE'
);

// Get modal elements
const modal = document.getElementById('checkout-modal');
const modalBackdrop = modal?.querySelector('.modal-backdrop');
const closeBtn = modal?.querySelector('.close-btn');
const checkoutContainer = document.getElementById('checkout-container');
const checkoutDetails = document.getElementById('checkout-details');
const checkoutLoading = document.getElementById('checkout-loading');
const checkoutError = document.getElementById('checkout-error');

// Plan details for display
const planDetails = {
  starter: {
    name: 'Starter Plan',
    credits: 100,
    price: '$9/month',
    features: [
      '100 AI Credits included',
      'LongCat + Emu formats',
      'Instagram & YouTube exports',
      'Style + tone presets',
      'Generation history',
      'Email support'
    ]
    features: ['100 generations per month', 'LongCat & Emu formats', 'Instagram & YouTube exports', 'Email support']
  },
  pro: {
    name: 'Pro Plan',
    credits: 500,
    price: '$29/month',
    features: [
      '500 AI Credits + 3 seats',
      'Unlimited exports & ratios',
      'Shared brand voice presets',
      'Priority generation & support',
      'Collaboration hub & approvals',
      'Advanced analytics insights'
    ]
  },
  enterprise: {
    name: 'Enterprise Plan',
    credits: 'Unlimited',
    price: 'Custom pricing',
    features: [
      'Dedicated success & enablement',
      'Private model + SOC 2 controls',
      'SSO + role-based governance',
      'Custom integrations & SLAs',
      'On-prem / VPC deployment',
      '24/7 concierge support'
    ]
    features: ['500 generations per month', 'All formats unlocked', 'All export platforms', 'Priority support', 'Advanced analytics']
  },
  enterprise: {
    name: 'Enterprise Plan',
    credits: 9999,
    price: '$99/month',
    features: ['Unlimited generations', 'Custom integrations', 'API access', 'Dedicated support', 'Team collaboration']
  }
};

/**
 * Show the checkout modal
 */
function showModal() {
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Hide the checkout modal
 */
function hideModal() {
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    // Reset modal content
    if (checkoutContainer) checkoutContainer.innerHTML = '';
    if (checkoutDetails) checkoutDetails.innerHTML = '';
    if (checkoutError) checkoutError.style.display = 'none';
  }
}

/**
 * Show loading state
 */
function showLoading(show = true) {
  if (checkoutLoading) {
    checkoutLoading.style.display = show ? 'block' : 'none';
  }
  if (checkoutContainer) {
    checkoutContainer.style.display = show ? 'none' : 'block';
  }
}

/**
 * Show error message
 */
function showError(message) {
  if (checkoutError) {
    checkoutError.textContent = message;
    checkoutError.style.display = 'block';
  }
  showLoading(false);
}

/**
 * Create checkout session and initialize Stripe Checkout
 */
async function initiateCheckout(plan, price, credits) {
  try {
    showLoading(true);
    
    // Get user token if available
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Create checkout session
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        plan,
        price,
        credits
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }
    
    const { clientSecret } = await response.json();
    
    // Initialize Stripe Embedded Checkout
    const checkout = await stripe.initEmbeddedCheckout({
      clientSecret
    });
    
    // Mount the checkout
    showLoading(false);
    checkout.mount('#checkout-container');
    
  } catch (error) {
    console.error('Checkout error:', error);
    showError(error.message || 'Failed to initialize checkout. Please try again.');
  }
}

/**
 * Handle checkout button clicks
 */
function handleCheckoutClick(event) {
  const button = event.target.closest('.pricing-btn');
  if (!button) return;
  
  const plan = button.dataset.plan;
  const price = parseInt(button.dataset.price);
  const credits = parseInt(button.dataset.credits);
  
  // Display plan details in modal
  if (checkoutDetails && planDetails[plan]) {
    const details = planDetails[plan];
    checkoutDetails.innerHTML = `
      <div class="checkout-summary">
        <h3>${details.name}</h3>
        <div class="checkout-price">${details.price}</div>
        <ul class="checkout-features">
          ${details.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  showModal();
  initiateCheckout(plan, price, credits);
}

/**
 * Initialize pricing page
 */
function initPricing() {
  // Add click handlers to all checkout buttons
  const checkoutButtons = document.querySelectorAll('.pricing-btn');
  checkoutButtons.forEach(button => {
    button.addEventListener('click', handleCheckoutClick);
  });
  
  // Close modal handlers
  if (closeBtn) {
    closeBtn.addEventListener('click', hideModal);
  }
  
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', hideModal);
  }
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) {
      hideModal();
    }
  });
  
  // Check for success/cancel in URL (after redirect from Stripe)
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  
  if (sessionId) {
    // Redirect to success page
    window.location.href = `/success.html?session_id=${sessionId}`;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPricing);
} else {
  initPricing();
}
