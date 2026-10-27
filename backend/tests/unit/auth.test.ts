import Fastify from 'fastify';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { authRoutes } from '../../src/routes/auth.js';

describe('Auth routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeAll(async () => {
    app = Fastify();
    await app.register(authRoutes, { prefix: '/api/v1/auth' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects GET /api/v1/auth/profile when missing authorization header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/profile',
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects POST /api/v1/auth/profile when missing authorization header', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/profile',
      payload: {
        fullName: 'Test Traveler',
        mobileNumber: '9876543210',
        countryCode: '+91',
      },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects malformed bearer token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/profile',
      headers: {
        authorization: 'Bearer invalid.jwt.token',
      },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
