// Socket.IO Service - Real-time communication
// Demonstrates: WebSocket server, sending/receiving messages, rooms

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const aiEngine = require('./aiEngine');
const trafficSimulator = require('./trafficSimulator');
const TrafficLog = require('../models/TrafficLog');
const Intersection = require('../models/Intersection');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // Socket.IO authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.user.role})`);

    // Join a specific intersection room
    socket.on('intersection:subscribe', (intersectionId) => {
      socket.join(`intersection:${intersectionId}`);
      console.log(`${socket.user.username} subscribed to intersection ${intersectionId}`);
    });

    // Manual signal override (admin/operator only)
    socket.on('signal:override', async (data) => {
      if (!['admin', 'operator'].includes(socket.user.role)) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      try {
        const { intersectionId, timings } = data;
        await Intersection.findByIdAndUpdate(intersectionId, {
          currentTimings: timings,
          mode: 'manual'
        });

        io.to(`intersection:${intersectionId}`).emit('signal:change', {
          intersectionId,
          timings,
          mode: 'manual',
          updatedBy: socket.user.username
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });

  // Listen to traffic simulator events and broadcast
  trafficSimulator.on('trafficUpdate', async (data) => {
    if (!io) return;

    // Calculate AI-optimized timings
    const intersection = await Intersection.findById(data.intersectionId);
    if (!intersection || intersection.mode !== 'auto') return;

    const newTimings = aiEngine.calculateOptimalTimings(
      data.directionData,
      intersection.currentTimings
    );

    const congestionLevel = aiEngine.getCongestionLevel(data.directionData);

    // Update intersection timings in DB
    await Intersection.findByIdAndUpdate(data.intersectionId, {
      currentTimings: newTimings
    });

    // Save traffic log
    await TrafficLog.create({
      intersectionId: data.intersectionId,
      directionData: data.directionData,
      totalVehicles: data.totalVehicles,
      congestionLevel
    });

    // Broadcast to all connected clients
    io.emit('traffic:update', {
      intersectionId: data.intersectionId,
      name: data.name,
      directionData: data.directionData,
      totalVehicles: data.totalVehicles,
      timings: newTimings,
      congestionLevel,
      timestamp: data.timestamp
    });

    // Emit signal change
    io.to(`intersection:${data.intersectionId}`).emit('signal:change', {
      intersectionId: data.intersectionId,
      timings: newTimings,
      mode: 'auto'
    });

    // Alert on high congestion
    if (congestionLevel === 'critical' || congestionLevel === 'high') {
      io.emit('alert:new', {
        type: congestionLevel,
        message: `${congestionLevel.toUpperCase()} congestion at ${data.name}`,
        intersectionId: data.intersectionId,
        totalVehicles: data.totalVehicles,
        timestamp: data.timestamp
      });
    }
  });

  return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };
