// Intersection Model - represents a traffic intersection
const mongoose = require('mongoose');

const intersectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  directions: {
    north: { lanes: { type: Number, default: 2 } },
    south: { lanes: { type: Number, default: 2 } },
    east: { lanes: { type: Number, default: 2 } },
    west: { lanes: { type: Number, default: 2 } }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  mode: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'auto'
  },
  currentTimings: {
    north: { green: { type: Number, default: 30 }, yellow: { type: Number, default: 5 } },
    south: { green: { type: Number, default: 30 }, yellow: { type: Number, default: 5 } },
    east: { green: { type: Number, default: 25 }, yellow: { type: Number, default: 5 } },
    west: { green: { type: Number, default: 25 }, yellow: { type: Number, default: 5 } }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Intersection', intersectionSchema);
