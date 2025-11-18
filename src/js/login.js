const loginForm = document.getElementById('login-form');

if (loginForm) {
  const submitBtn = loginForm.querySelector('button[type="submit"]');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;

    if (!email || !password) {
      window.showToast('Email and password are required.', 'error');
      return;
    }

    window.setButtonLoading?.(submitBtn, true);

    try {
      const response = await fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      if (!data.accessToken) {
        throw new Error('Authentication response missing access token.');
      }

      localStorage.setItem('token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      window.showToast('Welcome back! Redirecting you now.', 'success');
      window.location.href = '/dashboard.html';
    } catch (error) {
      console.error('Error logging in:', error);
      window.showToast(error.message || 'Login failed. Please try again.', 'error');
    } finally {
      window.setButtonLoading?.(submitBtn, false);
    }
  });
}
