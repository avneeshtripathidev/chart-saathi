import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/env.js';
import { trainRoutes } from './routes/trains.js';
import { chartRoutes } from './routes/charts.js';
import { pnrRoutes } from './routes/pnr.js';
import { stationRoutes } from './routes/stations.js';
import { authRoutes } from './routes/auth.js';

async function buildApp() {
  const app = Fastify({
    rewriteUrl(req) {
      const originalUrl = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'];
      if (typeof originalUrl === 'string' && originalUrl) {
        return originalUrl;
      }
      return req.url || '/';
    },
    logger: {
      level: config.NODE_ENV === 'production' || process.env.VERCEL ? 'info' : 'debug',
      transport:
        config.NODE_ENV !== 'production' && !process.env.VERCEL
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      serializers: {
        // Never log authorization headers or API keys
        req(request) {
          return {
            method: request.method,
            url: request.url,
            hostname: request.hostname,
            remoteAddress: request.ip,
          };
        },
      },
    },
  });

  // CORS
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, server-to-server, curl)
      if (!origin) return cb(null, true);
      const allowedOrigins = config.CORS_ORIGINS.split(',').map((o) => o.trim());
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return cb(null, true);
      }
      return cb(null, true); // Allow all for seamless mobile & testing access
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded. Retry after ${context.after}.`,
      },
    }),
  });

  // Root welcome & discovery endpoint
  app.get('/', async (_request, reply) => {
    return reply.send({
      name: 'ChartSaathi API',
      status: 'ok',
      version: '1.0.0',
      description: 'Indian Railway Chart Vacancy service',
      health: '/health',
      endpoints: {
        trains: '/api/v1/trains/search',
        charts: '/api/v1/charts/vacancy',
        pnr: '/api/v1/pnr/:pnrNumber',
        stations: '/api/v1/stations/search',
        auth: '/api/v1/auth/profile',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Direct Vercel function path fallbacks
  app.get('/api/index', async (_request, reply) => {
    return reply.send({
      name: 'ChartSaathi API',
      status: 'ok',
      version: '1.0.0',
      health: '/health',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api', async (_request, reply) => {
    return reply.send({
      name: 'ChartSaathi API',
      status: 'ok',
      version: '1.0.0',
      health: '/health',
      timestamp: new Date().toISOString(),
    });
  });

  // Health check
  app.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      version: '1.0.0',
      provider: config.CHART_PROVIDER,
      isDemo: config.CHART_PROVIDER === 'mock',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  await app.register(trainRoutes, { prefix: '/api/v1/trains' });
  await app.register(chartRoutes, { prefix: '/api/v1/charts' });
  await app.register(pnrRoutes, { prefix: '/api/v1/pnr' });
  await app.register(stationRoutes, { prefix: '/api/v1/stations' });
  await app.register(authRoutes, { prefix: '/api/v1/auth' });

  // Global error handler
  app.setErrorHandler((error, _request, reply) => {
    app.log.error({ err: error }, 'Unhandled error');
    return reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  });

  // 404 handler
  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  return app;
}

let appPromise: ReturnType<typeof buildApp> | null = null;

export async function getApp() {
  if (!appPromise) {
    appPromise = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  try {
    const headers = req?.headers || {};
    const originalUrl = headers['x-forwarded-uri'] || headers['x-matched-path'] || req?.url || '/';
    const app = await getApp();
    const response = await app.inject({
      method: req?.method || 'GET',
      url: originalUrl,
      headers: headers,
      payload: req?.body,
    });

    res.statusCode = response.statusCode;
    for (const [key, value] of Object.entries(response.headers)) {
      if (value !== undefined) {
        res.setHeader(key, value);
      }
    }
    return res.end(response.payload);
  } catch (err: any) {
    if (res && !res.headersSent) {
      res.statusCode = 500;
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/json');
      }
      res.end(JSON.stringify({
        success: false,
        error: {
          code: 'SERVERLESS_HANDLER_ERROR',
          message: err?.message || 'Internal server error',
          stack: err?.stack,
        },
      }));
    }
  }
}

async function start() {
  const app = await buildApp();
  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    app.log.info(`🚂 ChartSaathi backend running on port ${config.PORT}`);
    app.log.info(`📊 Provider: ${config.CHART_PROVIDER.toUpperCase()}${config.CHART_PROVIDER === 'mock' ? ' [DEMO MODE]' : ''}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

export { buildApp, start };


