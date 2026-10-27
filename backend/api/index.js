const path = require('path');

let appPromise = null;

function loadBuildApp() {
  try {
    return require('../dist/index.js').buildApp;
  } catch (e1) {
    try {
      return require(path.join(process.cwd(), 'dist', 'index.js')).buildApp;
    } catch (e2) {
      console.error('Critical: Failed to load buildApp from dist/index.js:', e1, e2);
      throw new Error(`Failed to load compiled backend (dist/index.js): ${e1.message}`);
    }
  }
}

async function getApp() {
  if (!appPromise) {
    const buildApp = loadBuildApp();
    appPromise = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

module.exports = async function handler(req, res) {
  try {
    // Restore original URL if Vercel internal rewrite passed it via header
    const originalUrl = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'];
    if (typeof originalUrl === 'string' && originalUrl) {
      req.url = originalUrl;
    }

    const app = await getApp();
    app.server.emit('request', req, res);
  } catch (err) {
    console.error('Fastify serverless invocation error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: {
          code: 'SERVERLESS_INVOCATION_ERROR',
          message: err.message || 'Internal server error',
          stack: err.stack,
        },
      }));
    }
  }
};
