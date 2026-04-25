// Request Logger Middleware
// Demonstrates: fs module, Streams, Zlib (compression)

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a write stream for logging (Stream module)
const logStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });

// Logger middleware
const logger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} ${duration}ms\n`;

    // Write to stream
    logStream.write(logEntry);
  });

  next();
};

// Function to compress old log files using Zlib
const compressLogFile = (filename) => {
  const filePath = path.join(logsDir, filename);
  const gzPath = filePath + '.gz';

  const readStream = fs.createReadStream(filePath);
  const writeStream = fs.createWriteStream(gzPath);
  const gzip = zlib.createGzip();

  readStream.pipe(gzip).pipe(writeStream);

  writeStream.on('finish', () => {
    fs.unlinkSync(filePath);
    console.log(`Compressed: ${filename} -> ${filename}.gz`);
  });
};

module.exports = { logger, compressLogFile };
