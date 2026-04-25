// Dashboard.js - Charts, stats, and data rendering

let flowChart = null;
let pieChart = null;
let selectedIntersectionId = null;
let trafficViz = null;
let flowDataPoints = { north: [], south: [], east: [], west: [], labels: [] };
const MAX_DATA_POINTS = 20;

// Initialize charts
function initCharts() {
  // Flow Chart (line chart)
  const flowCtx = document.getElementById('flow-chart');
  if (flowCtx) {
    flowChart = new Chart(flowCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { label: 'North', data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.4, fill: true },
          { label: 'South', data: [], borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.4, fill: true },
          { label: 'East', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true },
          { label: 'West', data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', tension: 0.4, fill: true }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 } } }
        },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
        }
      }
    });
  }

  // Pie Chart
  const pieCtx = document.getElementById('pie-chart');
  if (pieCtx) {
    pieChart = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: ['North', 'South', 'East', 'West'],
        datasets: [{
          data: [25, 25, 25, 25],
          backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
          borderColor: '#111827',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, font: { size: 11 } } }
        }
      }
    });
  }
}

// Load intersections list
async function loadIntersections() {
  try {
    const response = await apiFetch('/api/intersections');
    const list = document.getElementById('intersection-list');
    list.innerHTML = '';

    response.data.forEach((int, idx) => {
      const li = document.createElement('li');
      li.className = 'intersection-item' + (idx === 0 ? ' active' : '');
      li.innerHTML = `
        <div class="int-name">${int.name}</div>
        <div class="int-status">
          <span class="dot" style="background: ${int.status === 'active' ? 'var(--accent-green)' : 'var(--accent-red)'}"></span>
          ${int.status} · ${int.mode}
        </div>
      `;
      li.addEventListener('click', () => selectIntersection(int._id, int.name, li));
      list.appendChild(li);

      // Auto-select first
      if (idx === 0) {
        selectIntersection(int._id, int.name, li);
      }
    });
  } catch (err) {
    console.error('Failed to load intersections:', err);
  }
}

// Select an intersection
function selectIntersection(id, name, element) {
  selectedIntersectionId = id;

  // Update active state
  document.querySelectorAll('.intersection-item').forEach(el => el.classList.remove('active'));
  if (element) element.classList.add('active');

  // Update heading
  document.getElementById('selected-intersection-name').textContent = name;

  // Subscribe to its Socket.IO room
  subscribeToIntersection(id);

  // Reset chart data
  flowDataPoints = { north: [], south: [], east: [], west: [], labels: [] };

  showToast(`Monitoring: ${name}`, 'success');
}

// Handle real-time traffic update from socket
function onTrafficUpdate(data) {
  // Only process updates for the selected intersection
  if (selectedIntersectionId && data.intersectionId !== selectedIntersectionId) {
    return;
  }

  // Update stats
  document.getElementById('stat-vehicles').textContent = data.totalVehicles || 0;
  const congEl = document.getElementById('stat-congestion');
  congEl.textContent = (data.congestionLevel || 'low').toUpperCase();
  congEl.className = 'stat-value';

  // Update timings display
  const dirs = ['north', 'south', 'east', 'west'];
  dirs.forEach(dir => {
    const timingEl = document.getElementById(`timing-${dir}`);
    const vehicleEl = document.getElementById(`vehicles-${dir}`);
    if (timingEl && data.timings && data.timings[dir]) {
      timingEl.innerHTML = `${data.timings[dir].green}<span>s</span>`;
    }
    if (vehicleEl && data.directionData && data.directionData[dir]) {
      vehicleEl.textContent = `${data.directionData[dir].vehicleCount} vehicles`;
    }
  });

  // Calculate avg cycle
  if (data.timings) {
    const avgCycle = Math.round(dirs.reduce((s, d) => s + (data.timings[d]?.green || 0), 0) / 4);
    document.getElementById('stat-cycle').innerHTML = `${avgCycle}<span style="font-size:12px;color:var(--text-muted)">s</span>`;
  }

  // Update visualization
  if (trafficViz) {
    trafficViz.updateData(data.directionData, data.timings);
  }

  // Update charts
  updateCharts(data);
}

function onSignalChange(data) {
  const modeEl = document.getElementById('stat-mode');
  if (modeEl) {
    modeEl.textContent = (data.mode || 'auto').toUpperCase();
  }
}

function onNewAlert(data) {
  const feed = document.getElementById('alerts-feed');
  if (!feed) return;

  // Remove the "no alerts" placeholder
  if (feed.querySelector('.alert-item') && feed.firstElementChild.style.color) {
    feed.innerHTML = '';
  }

  const alertDiv = document.createElement('div');
  alertDiv.className = `alert-item ${data.type === 'critical' ? 'critical' : ''}`;
  alertDiv.innerHTML = `
    <div>${data.message} (${data.totalVehicles} vehicles)</div>
    <div class="alert-time">${new Date(data.timestamp).toLocaleTimeString()}</div>
  `;

  feed.insertBefore(alertDiv, feed.firstChild);

  // Keep only last 20 alerts
  while (feed.children.length > 20) {
    feed.removeChild(feed.lastChild);
  }

  // Toast notification for critical
  if (data.type === 'critical') {
    showToast(data.message, 'error');
  }
}

function updateCharts(data) {
  if (!flowChart || !pieChart) return;

  const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dd = data.directionData;

  // Add data points
  flowDataPoints.labels.push(time);
  flowDataPoints.north.push(dd.north?.vehicleCount || 0);
  flowDataPoints.south.push(dd.south?.vehicleCount || 0);
  flowDataPoints.east.push(dd.east?.vehicleCount || 0);
  flowDataPoints.west.push(dd.west?.vehicleCount || 0);

  // Trim to max
  if (flowDataPoints.labels.length > MAX_DATA_POINTS) {
    flowDataPoints.labels.shift();
    flowDataPoints.north.shift();
    flowDataPoints.south.shift();
    flowDataPoints.east.shift();
    flowDataPoints.west.shift();
  }

  // Update flow chart
  flowChart.data.labels = flowDataPoints.labels;
  flowChart.data.datasets[0].data = flowDataPoints.north;
  flowChart.data.datasets[1].data = flowDataPoints.south;
  flowChart.data.datasets[2].data = flowDataPoints.east;
  flowChart.data.datasets[3].data = flowDataPoints.west;
  flowChart.update('none');

  // Update pie chart
  pieChart.data.datasets[0].data = [
    dd.north?.vehicleCount || 0,
    dd.south?.vehicleCount || 0,
    dd.east?.vehicleCount || 0,
    dd.west?.vehicleCount || 0
  ];
  pieChart.update('none');
}
