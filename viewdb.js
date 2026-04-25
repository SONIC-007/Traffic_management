// Quick script to view all data in the database
require('dotenv').config();
const mongoose = require('mongoose');

async function viewDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Show all collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('📦 Collections:', collections.map(c => c.name).join(', '));
  console.log('─'.repeat(60));

  // Show Users
  const users = await mongoose.connection.db.collection('users').find().toArray();
  console.log(`\n👤 USERS (${users.length}):`);
  users.forEach(u => {
    console.log(`   • ${u.username} | ${u.email} | Role: ${u.role} | Created: ${u.createdAt}`);
  });

  // Show Intersections
  const intersections = await mongoose.connection.db.collection('intersections').find().toArray();
  console.log(`\n🚦 INTERSECTIONS (${intersections.length}):`);
  intersections.forEach(i => {
    console.log(`   • ${i.name} | Status: ${i.status} | Mode: ${i.mode}`);
    console.log(`     Timings → N:${i.currentTimings?.north?.green}s  S:${i.currentTimings?.south?.green}s  E:${i.currentTimings?.east?.green}s  W:${i.currentTimings?.west?.green}s`);
  });

  // Show recent Traffic Logs
  const logs = await mongoose.connection.db.collection('trafficlogs')
    .find().sort({ timestamp: -1 }).limit(5).toArray();
  console.log(`\n📊 RECENT TRAFFIC LOGS (showing last 5):`);
  logs.forEach(l => {
    const d = l.directionData;
    console.log(`   • [${new Date(l.timestamp).toLocaleTimeString()}] Total: ${l.totalVehicles} | Congestion: ${l.congestionLevel}`);
    console.log(`     N:${d?.north?.vehicleCount} S:${d?.south?.vehicleCount} E:${d?.east?.vehicleCount} W:${d?.west?.vehicleCount}`);
  });

  // Count total logs
  const totalLogs = await mongoose.connection.db.collection('trafficlogs').countDocuments();
  console.log(`\n   Total traffic log entries: ${totalLogs}`);

  await mongoose.disconnect();
}

viewDB().catch(console.error);
