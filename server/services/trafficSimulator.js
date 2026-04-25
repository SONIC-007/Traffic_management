// Traffic Simulator - generates realistic traffic data
// Demonstrates: EventEmitter, Callbacks, setInterval, JSON

const EventEmitter = require('events');

class TrafficSimulator extends EventEmitter {
  constructor() {
    super();
    this.intersections = new Map();
    this.running = false;
    this.intervalId = null;
  }

  // Register an intersection for simulation
  addIntersection(id, name, callback) {
    this.intersections.set(id, { name, data: this._generateInitialData() });
    // Callback pattern to confirm registration
    if (typeof callback === 'function') {
      callback(null, `Intersection "${name}" registered for simulation`);
    }
  }

  // Generate initial traffic data
  _generateInitialData() {
    return {
      north: { vehicleCount: 10, queueLength: 3 },
      south: { vehicleCount: 8, queueLength: 2 },
      east: { vehicleCount: 12, queueLength: 4 },
      west: { vehicleCount: 6, queueLength: 2 }
    };
  }

  // Simulate time-of-day traffic pattern
  _getTimeMultiplier() {
    const hour = new Date().getHours();
    // Rush hours: 8-10 AM and 5-7 PM
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) return 1.8;
    // Daytime
    if (hour >= 6 && hour <= 22) return 1.0;
    // Nighttime
    return 0.3;
  }

  // Update traffic data with realistic variation
  _updateTrafficData(data) {
    const multiplier = this._getTimeMultiplier();
    const directions = ['north', 'south', 'east', 'west'];

    const newData = {};
    directions.forEach(dir => {
      const prev = data[dir];
      // Random variation: -5 to +5 vehicles
      const change = Math.floor(Math.random() * 11) - 5;
      const vehicleCount = Math.max(0, Math.min(50,
        Math.round((prev.vehicleCount + change) * multiplier)
      ));
      const queueLength = Math.max(0, Math.round(vehicleCount * 0.3 + Math.random() * 3));

      newData[dir] = { vehicleCount, queueLength };
    });

    return newData;
  }

  // Start simulation loop
  start(intervalMs = 3000) {
    if (this.running) return;
    this.running = true;

    this.intervalId = setInterval(() => {
      this.intersections.forEach((intersection, id) => {
        intersection.data = this._updateTrafficData(intersection.data);

        const totalVehicles = Object.values(intersection.data)
          .reduce((sum, d) => sum + d.vehicleCount, 0);

        // Emit traffic update event (EventEmitter pattern)
        this.emit('trafficUpdate', {
          intersectionId: id,
          name: intersection.name,
          directionData: intersection.data,
          totalVehicles,
          timestamp: new Date()
        });
      });
    }, intervalMs);

    console.log('Traffic simulator started');
  }

  // Stop simulation
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.running = false;
      console.log('Traffic simulator stopped');
    }
  }
}

module.exports = new TrafficSimulator();
