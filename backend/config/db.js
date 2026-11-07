const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skybrisk_erp';

  try {
    // Attempt standard connection
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    if (process.env.USE_MEMORY_DB_FALLBACK !== 'false') {
      console.warn(`[MongoDB Warning] Could not connect to external MongoDB at ${uri}.`);
      console.log('[MongoDB] Starting MongoMemoryServer for standalone zero-config execution...');

      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memUri = mongodInstance.getUri();

        const conn = await mongoose.connect(memUri);
        console.log(`[MongoDB] Successfully connected to In-Memory MongoDB instance at: ${memUri}`);

        // Trigger auto seed if in memory
        const { seedInitialData } = require('../seeder/seedData');
        await seedInitialData();

        return conn;
      } catch (memErr) {
        console.error('[MongoDB Error] Failed to start In-Memory MongoDB:', memErr.message);
        throw memErr;
      }
    } else {
      console.error('[MongoDB Error] Connection failed:', err.message);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('Error disconnecting from DB:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };

