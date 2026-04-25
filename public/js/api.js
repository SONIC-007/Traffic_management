// API Helper - Fetch wrapper with JWT token management

const API_BASE = '';

// Get stored token
function getToken() {
  return localStorage.getItem('token');
}

// Set token
function setToken(token) {
  localStorage.setItem('token', token);
}

// Remove token
function removeToken() {
  localStorage.removeItem('token');
}

// Get stored user
function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Set user
function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

// API fetch with JWT
async function apiFetch(url, options = {}) {
  const token = getToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Logout handler (available on all pages)
function handleLogout() {
  removeToken();
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}
