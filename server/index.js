require('dotenv').config();

process.env.PORT = process.env.PORT || '5000';

const mongoose = require('mongoose');
const startServer = require('./src/index');
const User = require('./src/models/User');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/interesthub';

async function bootstrap() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('연결 성공');

    await User.syncIndexes();
    console.log('구버전 인덱스 동기화 완료!');

    startServer();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}

bootstrap();
