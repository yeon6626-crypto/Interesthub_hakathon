require('dotenv').config();

const env = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/interesthub',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'interesthub-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
module.exports = env;
