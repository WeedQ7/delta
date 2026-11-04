import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: false }));
  // simple in-memory rate limiter for API protection (v1)
  const hits = new Map<string, { n: number; t: number }>();
  app.use((req: any, res: any, next: any) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const rec = hits.get(ip);
    if (!rec || now - rec.t > 10_000) hits.set(ip, { n: 1, t: now });
    else { rec.n++; if (rec.n > 100) { res.status(429).json({ message: 'Слишком много запросов' }); return; } }
    next();
  });
  // static uploads + test audio (served under BOTH /audio and /api/audio — the Vite proxy forwards /api/* verbatim)
  const audioDir = join(process.cwd(), 'public', 'audio');
  const uploadsDir = join(process.cwd(), process.env.UPLOAD_DIR || './uploads');
  app.use('/uploads', express.static(uploadsDir));
  app.use('/audio', express.static(audioDir));
  app.use('/api/audio', express.static(audioDir));
  app.use('/api/uploads', express.static(uploadsDir));
  app.use((_req: any, res: any, next: any) => { if (_req.path === '/' || _req.path === '/api') { res.json({ name: 'DELTA API', status: 'ok' }); return; } if (_req.path === '/api/health') { res.json({ status: 'ok', service: 'delta-api', time: new Date().toISOString() }); return; } next(); });
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  console.log(`DELTA API listening on http://localhost:${port}/api`);
}
bootstrap();
