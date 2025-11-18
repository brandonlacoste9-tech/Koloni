const signupForm = document.getElementById('signup-form');

if (signupForm) {
  const submitBtn = signupForm.querySelector('button[type="submit"]');

  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = signupForm.name.value.trim();
    const email = signupForm.email.value.trim();
    const password = signupForm.password.value;
    const confirmPassword = signupForm['confirm-password'].value;

    if (password !== confirmPassword) {
      window.showToast('Passwords do not match.', 'error');
      return;
    }

    if (!signupForm.terms.checked) {
      window.showToast('Please accept the terms before continuing.', 'warning');
      return;
    }

    window.setButtonLoading?.(submitBtn, true);

    try {
      const response = await fetch('/.netlify/functions/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to create account.');
      }

      window.showToast('Account created! Signing you in…', 'success');

      // Automatically sign the user in to retrieve a token
      const loginResponse = await fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.accessToken) {
        localStorage.setItem('token', loginData.accessToken);
        if (loginData.refreshToken) {
          localStorage.setItem('refreshToken', loginData.refreshToken);
        }
        window.location.href = '/dashboard.html';
        return;
      }

      window.showToast('Account created. Please log in.', 'info');
      window.location.href = '/login.html';
    } catch (error) {
      console.error('Error signing up:', error);
      window.showToast(error.message || 'Signup failed. Please try again.', 'error');
    } finally {
      window.setButtonLoading?.(submitBtn, false);
    }
  });
}
