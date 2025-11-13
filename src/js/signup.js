const signupForm = document.getElementById('signup-form');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = signupForm.name.value;
    const email = signupForm.email.value;
    const password = signupForm.password.value;

    try {
        const response = await fetch('/.netlify/functions/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        });

        if (response.ok) {
            alert('Signup successful! Please login.');
            window.location.href = '/login.html';
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        console.error('Error signing up:', error);
        alert('An error occurred. Please try again.');
    }
});