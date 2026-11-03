"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const path_1 = require("path");
const express = __importStar(require("express"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors({ origin: true, credentials: true });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: false }));
    const hits = new Map();
    app.use((req, res, next) => {
        const ip = req.ip || 'unknown';
        const now = Date.now();
        const rec = hits.get(ip);
        if (!rec || now - rec.t > 10_000)
            hits.set(ip, { n: 1, t: now });
        else {
            rec.n++;
            if (rec.n > 100) {
                res.status(429).json({ message: 'Слишком много запросов' });
                return;
            }
        }
        next();
    });
    const audioDir = (0, path_1.join)(process.cwd(), 'public', 'audio');
    const uploadsDir = (0, path_1.join)(process.cwd(), process.env.UPLOAD_DIR || './uploads');
    app.use('/uploads', express.static(uploadsDir));
    app.use('/audio', express.static(audioDir));
    app.use('/api/audio', express.static(audioDir));
    app.use('/api/uploads', express.static(uploadsDir));
    app.use((_req, res, next) => { if (_req.path === '/' || _req.path === '/api') {
        res.json({ name: 'DELTA API', status: 'ok' });
        return;
    } if (_req.path === '/api/health') {
        res.json({ status: 'ok', service: 'delta-api', time: new Date().toISOString() });
        return;
    } next(); });
    const port = Number(process.env.PORT) || 3001;
    await app.listen(port);
    console.log(`DELTA API listening on http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map