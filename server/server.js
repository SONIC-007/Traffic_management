// Main Server - Entry Point
// Demonstrates: HTTP module, Express, middleware (cookie-parser, session, helmet),
// app.use(), app.all(), Streams, EventEmitter, Core/Third-party modules

require('dotenv').config();

// Core Modules
const http = require('http');
const path = require('path');
const fs = require('fs');

// Third-party Modules
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression'); // zlib-based compression
const morgan = require('morgan');

// Local Modules
const connectDB = require('./config/db');
const { logger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { initSocket } = require('./services/socketService');
const trafficSimulator = require('./services/trafficSimulator');
const Intersection = require('./models/Intersection');

// Initialize Express app
const app = express();

// Create HTTP server using Node.js http module (wrapping Express)
const server = http.createServer(app);

// ---- MIDDLEWARE SETUP (app.use()) ----

// Security headers (helmet)
app.use(helmet({
  contentSecurityPolicy: false // disable for development
}));

// CORS
app.use(cors());

// Compression (zlib-based)
app.use(compression());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// Express session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Morgan HTTP logger
app.use(morgan('dev'));

// Custom logger middleware (uses Streams & fs)
app.use(logger);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---- app.all() demonstration ----
// Log all API requests
app.all('/api/*', (req, res, next) => {
  console.log(`[API] ${req.method} ${req.url} by ${req.ip}`);
  next();
});

// ---- ROUTES (express.Router) ----
app.use('/api/auth', require('./routes/auth'));
app.use('/api/intersections', require('./routes/intersections'));
app.use('/api/traffic', require('./routes/traffic'));
app.use('/api/signals', require('./routes/signals'));

// ---- ERROR HANDLER (must be last middleware) ----
app.use(errorHandler);

// ---- START SERVER ----
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Initialize Socket.IO
  initSocket(server);

  // Seed default intersections if none exist
  const count = await Intersection.countDocuments();
  if (count === 0) {
    const defaults = [
      { name: 'Main St & 1st Ave', location: { lat: 28.6139, lng: 77.2090 } },
      { name: 'Highway Junction', location: { lat: 28.6280, lng: 77.2200 } },
      { name: 'Market Square', location: { lat: 28.6350, lng: 77.2150 } },
      { name: 'Station Road Cross', location: { lat: 28.6420, lng: 77.2300 } }
    ];
    await Intersection.insertMany(defaults);
    console.log('Seeded 4 default intersections');
  }

  // Start traffic simulator with all intersections
  const intersections = await Intersection.find({ status: 'active' });
  intersections.forEach(int => {
    trafficSimulator.addIntersection(int._id.toString(), int.name, (err, msg) => {
      if (err) console.error(err);
      else console.log(msg);
    });
  });
  trafficSimulator.start(3000); // update every 3 seconds

  // Start HTTP server
  server.listen(PORT, () => {
    console.log(`\n🚦 Smart Traffic Management Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO: ws://localhost:${PORT}\n`);
  });

  // EventEmitter: server lifecycle events
  server.on('error', (err) => {
    console.error('Server error:', err);
  });

  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    trafficSimulator.stop();
    server.close();
    process.exit(0);
  });
};

startServer().catch(console.error);
