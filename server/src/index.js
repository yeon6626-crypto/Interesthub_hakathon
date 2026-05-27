const app = require('./app');
const env = require('./config/env');

function startServer() {
  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
    console.log(`Environment: ${env.nodeEnv}`);
    console.log('API base: /api');
    console.log('  POST /api/exchanges/payback');
    console.log('  GET  /api/exchanges/me');
    console.log('  GET  /api/exchanges/meta');
  });
}

module.exports = startServer;
