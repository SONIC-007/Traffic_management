// Socket.IO Client - Real-time communication

let socket = null;

function initSocket() {
  const token = getToken();
  if (!token) return;

  socket = io({
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    showToast('Connected to real-time feed', 'success');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket auth error:', err.message);
    if (err.message === 'Authentication required' || err.message === 'Invalid token') {
      handleLogout();
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  // Listen for traffic updates
  socket.on('traffic:update', (data) => {
    if (typeof onTrafficUpdate === 'function') {
      onTrafficUpdate(data);
    }
  });

  // Listen for signal changes
  socket.on('signal:change', (data) => {
    if (typeof onSignalChange === 'function') {
      onSignalChange(data);
    }
  });

  // Listen for alerts
  socket.on('alert:new', (data) => {
    if (typeof onNewAlert === 'function') {
      onNewAlert(data);
    }
  });

  return socket;
}

function subscribeToIntersection(intersectionId) {
  if (socket) {
    socket.emit('intersection:subscribe', intersectionId);
  }
}
