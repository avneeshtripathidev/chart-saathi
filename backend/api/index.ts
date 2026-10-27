import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp } from '../src/index.js';

let appPromise: ReturnType<typeof buildApp> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!appPromise) {
    appPromise = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }
  const app = await appPromise;
  app.server.emit('request', req, res);
}
