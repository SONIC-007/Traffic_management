// TrafficLog Model - stores historical traffic data
const mongoose = require('mongoose');

const trafficLogSchema = new mongoose.Schema({
  intersectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intersection',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  directionData: {
    north: { vehicleCount: Number, queueLength: Number },
    south: { vehicleCount: Number, queueLength: Number },
    east: { vehicleCount: Number, queueLength: Number },
    west: { vehicleCount: Number, queueLength: Number }
  },
  totalVehicles: {
    type: Number,
    default: 0
  },
  congestionLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    default: 'low'
  }
});

module.exports = mongoose.model('TrafficLog', trafficLogSchema);
