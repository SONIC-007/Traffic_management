// Traffic Visualization - Canvas-based intersection renderer

class TrafficVisualization {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.roadWidth = 60;

    // Signal states: 'red', 'yellow', 'green'
    this.signals = {
      north: 'red',
      south: 'red',
      east: 'green',
      west: 'green'
    };

    // Vehicle counts
    this.vehicles = {
      north: 0, south: 0, east: 0, west: 0
    };

    // Animation
    this.animFrame = null;
    this.carPositions = [];
    this._initCars();
    this.draw();
  }

  _initCars() {
    this.carPositions = [];
    const dirs = ['north', 'south', 'east', 'west'];
    dirs.forEach(dir => {
      for (let i = 0; i < 5; i++) {
        this.carPositions.push({
          dir,
          offset: Math.random() * 150 + 30,
          lane: Math.random() > 0.5 ? 0 : 1,
          speed: 0.3 + Math.random() * 0.5,
          color: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 6)]
        });
      }
    });
  }

  updateData(directionData, timings) {
    if (directionData) {
      this.vehicles = {
        north: directionData.north?.vehicleCount || 0,
        south: directionData.south?.vehicleCount || 0,
        east: directionData.east?.vehicleCount || 0,
        west: directionData.west?.vehicleCount || 0
      };
    }

    // Determine signal states based on timings (highest green = currently green)
    if (timings) {
      const dirs = ['north', 'south', 'east', 'west'];
      const maxGreen = Math.max(...dirs.map(d => timings[d]?.green || 0));
      dirs.forEach(d => {
        const green = timings[d]?.green || 0;
        if (green === maxGreen) {
          this.signals[d] = 'green';
        } else if (green > maxGreen * 0.7) {
          this.signals[d] = 'yellow';
        } else {
          this.signals[d] = 'red';
        }
      });
    }
  }

  draw() {
    const ctx = this.ctx;
    const cx = this.centerX;
    const cy = this.centerY;
    const rw = this.roadWidth;

    // Clear
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw grass/ground
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw roads
    ctx.fillStyle = '#2d3748';

    // Vertical road (North-South)
    ctx.fillRect(cx - rw, 0, rw * 2, this.height);

    // Horizontal road (East-West)
    ctx.fillRect(0, cy - rw, this.width, rw * 2);

    // Road center lines
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);

    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, cy - rw);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + rw);
    ctx.lineTo(cx, this.height);
    ctx.stroke();

    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(cx - rw, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + rw, cy);
    ctx.lineTo(this.width, cy);
    ctx.stroke();

    ctx.setLineDash([]);

    // Intersection box
    ctx.fillStyle = '#374151';
    ctx.fillRect(cx - rw, cy - rw, rw * 2, rw * 2);

    // Crosswalk lines
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    for (let i = -rw + 8; i < rw; i += 10) {
      // Top crosswalk
      ctx.beginPath();
      ctx.moveTo(cx + i, cy - rw);
      ctx.lineTo(cx + i, cy - rw + 8);
      ctx.stroke();
      // Bottom crosswalk
      ctx.beginPath();
      ctx.moveTo(cx + i, cy + rw - 8);
      ctx.lineTo(cx + i, cy + rw);
      ctx.stroke();
    }

    // Draw traffic lights
    this._drawTrafficLight(cx - rw - 30, cy - rw - 30, this.signals.north, 'N');
    this._drawTrafficLight(cx + rw + 5, cy + rw + 5, this.signals.south, 'S');
    this._drawTrafficLight(cx + rw + 5, cy - rw - 30, this.signals.east, 'E');
    this._drawTrafficLight(cx - rw - 30, cy + rw + 5, this.signals.west, 'W');

    // Draw cars
    this._drawCars();

    // Draw vehicle count labels
    this._drawLabel(cx, 20, `▼ ${this.vehicles.north}`, this.signals.north);
    this._drawLabel(cx, this.height - 12, `▲ ${this.vehicles.south}`, this.signals.south);
    this._drawLabel(this.width - 30, cy, `◀ ${this.vehicles.east}`, this.signals.east);
    this._drawLabel(30, cy, `▶ ${this.vehicles.west}`, this.signals.west);

    // Direction labels
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NORTH', cx, 40);
    ctx.fillText('SOUTH', cx, this.height - 22);
    ctx.fillText('EAST', this.width - 30, cy + 20);
    ctx.fillText('WEST', 30, cy + 20);

    // Animate
    this._updateCarPositions();
    this.animFrame = requestAnimationFrame(() => this.draw());
  }

  _drawTrafficLight(x, y, state, label) {
    const ctx = this.ctx;
    const w = 24;
    const h = 26;

    // Box
    ctx.fillStyle = '#1f2937';
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();

    const colors = {
      red: state === 'red' ? '#ef4444' : '#3f1f1f',
      yellow: state === 'yellow' ? '#f59e0b' : '#3f3520',
      green: state === 'green' ? '#22c55e' : '#1f3f28'
    };

    // Red
    ctx.beginPath();
    ctx.arc(x + w/2, y + 6, 4, 0, Math.PI * 2);
    ctx.fillStyle = colors.red;
    if (state === 'red') ctx.shadowColor = '#ef4444', ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Yellow
    ctx.beginPath();
    ctx.arc(x + w/2, y + h/2, 4, 0, Math.PI * 2);
    ctx.fillStyle = colors.yellow;
    if (state === 'yellow') ctx.shadowColor = '#f59e0b', ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Green
    ctx.beginPath();
    ctx.arc(x + w/2, y + h - 6, 4, 0, Math.PI * 2);
    ctx.fillStyle = colors.green;
    if (state === 'green') ctx.shadowColor = '#22c55e', ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  _drawCars() {
    const ctx = this.ctx;
    const cx = this.centerX;
    const cy = this.centerY;
    const rw = this.roadWidth;

    this.carPositions.forEach(car => {
      ctx.fillStyle = car.color;
      let x, y, w, h;

      const laneOff = car.lane === 0 ? -15 : 8;

      if (car.dir === 'north') {
        x = cx + laneOff;
        y = cy - rw - car.offset;
        w = 10; h = 16;
      } else if (car.dir === 'south') {
        x = cx + laneOff;
        y = cy + rw + car.offset;
        w = 10; h = 16;
      } else if (car.dir === 'east') {
        x = cx + rw + car.offset;
        y = cy + laneOff;
        w = 16; h = 10;
      } else {
        x = cx - rw - car.offset;
        y = cy + laneOff;
        w = 16; h = 10;
      }

      if (x > -20 && x < this.width + 20 && y > -20 && y < this.height + 20) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 2);
        ctx.fill();

        // Headlights
        ctx.fillStyle = 'rgba(255,255,200,0.7)';
        if (car.dir === 'north') {
          ctx.fillRect(x + 1, y, 3, 2);
          ctx.fillRect(x + w - 4, y, 3, 2);
        } else if (car.dir === 'south') {
          ctx.fillRect(x + 1, y + h - 2, 3, 2);
          ctx.fillRect(x + w - 4, y + h - 2, 3, 2);
        } else if (car.dir === 'east') {
          ctx.fillRect(x + w - 2, y + 1, 2, 3);
          ctx.fillRect(x + w - 2, y + h - 4, 2, 3);
        } else {
          ctx.fillRect(x, y + 1, 2, 3);
          ctx.fillRect(x, y + h - 4, 2, 3);
        }
      }
    });
  }

  _updateCarPositions() {
    this.carPositions.forEach(car => {
      const isGreen = this.signals[car.dir] === 'green';
      // Cars move when green, slowly when yellow, stop when red
      if (isGreen) {
        car.offset -= car.speed;
      } else if (this.signals[car.dir] === 'yellow') {
        car.offset -= car.speed * 0.3;
      }
      // Reset position when car goes through intersection
      if (car.offset < -30) {
        car.offset = 80 + Math.random() * 80;
      }
    });
  }

  _drawLabel(x, y, text, signal) {
    const ctx = this.ctx;
    ctx.font = 'bold 13px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const colors = { red: '#ef4444', yellow: '#f59e0b', green: '#22c55e' };
    ctx.fillStyle = colors[signal] || '#94a3b8';
    ctx.fillText(text, x, y);
  }

  destroy() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
    }
  }
}
