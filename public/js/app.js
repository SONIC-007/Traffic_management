// App.js - Main application initialization

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    window.location.href = '/login.html';
    return;
  }

  // Verify token is still valid
  try {
    await apiFetch('/api/auth/me');
  } catch (err) {
    removeToken();
    localStorage.removeItem('user');
    window.location.href = '/login.html';
    return;
  }

  // Display user info
  document.getElementById('user-name').textContent = user.username;
  document.getElementById('user-role').textContent = user.role;

  // Initialize traffic visualization
  trafficViz = new TrafficVisualization('traffic-canvas');

  // Initialize charts
  initCharts();

  // Load intersections
  await loadIntersections();

  // Initialize Socket.IO
  initSocket();
});
