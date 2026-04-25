// AI Traffic Engine - Smart signal timing optimization
// Demonstrates: EventEmitter, Callbacks, async/await, Working with JSON

const EventEmitter = require('events');

class AITrafficEngine extends EventEmitter {
  constructor() {
    super();
    this.MIN_GREEN = 10;  // minimum green time in seconds
    this.MAX_GREEN = 60;  // maximum green time in seconds
    this.YELLOW_TIME = 5;
    this.history = {};    // stores recent data for smoothing
  }

  // Calculate optimal timings based on traffic data
  calculateOptimalTimings(trafficData, currentTimings) {
    const directions = ['north', 'south', 'east', 'west'];
    const totalCycleTime = 120; // total cycle in seconds

    // Step 1: Calculate demand score for each direction
    const scores = {};
    let totalScore = 0;

    directions.forEach(dir => {
      const data = trafficData[dir] || { vehicleCount: 0, queueLength: 0 };
      // Weighted scoring: vehicles count more, queue length adds urgency
      const score = (data.vehicleCount * 1.0) + (data.queueLength * 1.5);
      scores[dir] = Math.max(score, 1); // minimum score of 1
      totalScore += scores[dir];
    });

    // Step 2: Distribute green time proportionally
    const yellowTotal = directions.length * this.YELLOW_TIME;
    const availableGreen = totalCycleTime - yellowTotal;
    const newTimings = {};

    directions.forEach(dir => {
      const proportion = scores[dir] / totalScore;
      let greenTime = Math.round(availableGreen * proportion);

      // Apply min/max constraints
      greenTime = Math.max(this.MIN_GREEN, Math.min(this.MAX_GREEN, greenTime));

      newTimings[dir] = {
        green: greenTime,
        yellow: this.YELLOW_TIME,
        score: Math.round(scores[dir] * 10) / 10
      };
    });

    // Step 3: Smooth transitions using previous timings
    if (currentTimings) {
      directions.forEach(dir => {
        const oldGreen = currentTimings[dir]?.green || 25;
        // Exponential moving average (70% new, 30% old)
        newTimings[dir].green = Math.round(newTimings[dir].green * 0.7 + oldGreen * 0.3);
      });
    }

    // Emit event for listeners
    this.emit('timingUpdate', newTimings);

    return newTimings;
  }

  // Determine congestion level
  getCongestionLevel(trafficData) {
    const totalVehicles = Object.values(trafficData)
      .reduce((sum, d) => sum + (d.vehicleCount || 0), 0);

    if (totalVehicles > 80) return 'critical';
    if (totalVehicles > 50) return 'high';
    if (totalVehicles > 25) return 'moderate';
    return 'low';
  }
}

module.exports = new AITrafficEngine();
