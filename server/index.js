const env = require('./src/config/env');
const {
  connectMongo,
  logMongoConnectionHelp,
} = require('./src/config/connectMongo');
const startServer = require('./src/index');
const User = require('./src/models/User');

async function bootstrap() {
  try {
    await connectMongo(env.mongodbUri);
    console.log(
      env.isAtlasMongo ? 'MongoDB Atlas 연결 성공' : '로컬 MongoDB 연결 성공'
    );

    await User.syncIndexes();
    console.log('구버전 인덱스 동기화 완료!');

    startServer();
  } catch (error) {
    logMongoConnectionHelp(error);
    process.exit(1);
  }
}

bootstrap();
