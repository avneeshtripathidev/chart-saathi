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
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        config.NODE_ENV !== 'production'
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
    origin: config.CORS_ORIGINS.split(',').map((o) => o.trim()),
    methods: ['GET', 'OPTIONS'],
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

export { buildApp };

// Only listen on port when running standalone (not in Vercel serverless)
if (!process.env.VERCEL) {
  start();
}
