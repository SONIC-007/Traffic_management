// Auth.js - Login and Register form handling

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to dashboard
  if (getToken()) {
    window.location.href = '/';
    return;
  }

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Register form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('auth-error');

  try {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setToken(data.token);
    setUser(data.user);
    window.location.href = '/';
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.add('show');
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  const errorDiv = document.getElementById('auth-error');

  try {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, role })
    });

    setToken(data.token);
    setUser(data.user);
    window.location.href = '/';
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.add('show');
  }
}

function handleLogout() {
  removeToken();
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}
