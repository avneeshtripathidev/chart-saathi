const { buildApp } = require('../dist/index.js');

let appPromise = null;

async function getApp() {
  if (!appPromise) {
    appPromise = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

module.exports = async function handler(req, res) {
  // Restore original URL if Vercel internal rewrite passed it via header
  const originalUrl = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'];
  if (typeof originalUrl === 'string' && originalUrl) {
    req.url = originalUrl;
  }

  const app = await getApp();
  app.server.emit('request', req, res);
};
