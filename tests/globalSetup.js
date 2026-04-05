const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

module.exports = async function globalSetup() {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.TEST_MONGO_URI = mongoServer.getUri();
  // Store the server instance for teardown
  global.__MONGOSERVER__ = mongoServer;
};
