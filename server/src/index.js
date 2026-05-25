const app = require('./app');
const env = require('./config/env');

function startServer() {
  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
    console.log(`Environment: ${env.nodeEnv}`);
  });
}

module.exports = startServer;
