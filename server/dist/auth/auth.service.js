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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const sha256 = (s) => (0, crypto_1.createHash)('sha256').update(s).digest('hex');
let AuthService = class AuthService {
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    async register(dto) {
        const email = dto.email.toLowerCase().trim();
        const username = dto.username.toLowerCase().trim();
        const existsEmail = await this.prisma.user.findUnique({ where: { email } });
        if (existsEmail)
            throw new common_1.ConflictException('Email уже зарегистрирован');
        const existsUser = await this.prisma.user.findUnique({ where: { username } });
        if (existsUser)
            throw new common_1.ConflictException('Username уже занят');
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email, username, passwordHash,
                profile: { create: { displayName: dto.displayName || username } },
                settings: { create: {} },
            },
        });
        return this.issueTokens(user.id, user.username, 'web');
    }
    async login(dto, device = 'web') {
        const login = dto.login.toLowerCase().trim();
        const user = await this.prisma.user.findFirst({ where: { OR: [{ email: login }, { username: login }] } });
        if (!user)
            throw new common_1.UnauthorizedException('Неверный логин или пароль');
        const ok = await bcrypt.compare(dto.password, user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException('Неверный логин или пароль');
        return this.issueTokens(user.id, user.username, device);
    }
    async issueTokens(userId, username, device) {
        const accessToken = await this.jwt.signAsync({ sub: userId, username });
        const refreshRaw = (0, crypto_1.randomBytes)(48).toString('hex');
        const tokenHash = sha256(refreshRaw);
        const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
        await this.prisma.session.create({ data: { userId, device, expiresAt } });
        await this.prisma.refreshToken.create({ data: { tokenHash, userId, expiresAt } });
        return { accessToken, refreshToken: refreshRaw };
    }
    async refresh(refreshToken) {
        const tokenHash = sha256(refreshToken);
        const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
        if (!stored || stored.revoked || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Сессия недействительна');
        }
        await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
        const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        return this.issueTokens(user.id, user.username, 'refresh');
    }
    async logout(refreshToken) {
        if (refreshToken) {
            await this.prisma.refreshToken.updateMany({ where: { tokenHash: sha256(refreshToken) }, data: { revoked: true } });
        }
        return { ok: true };
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!user)
            return { sent: true };
        const raw = (0, crypto_1.randomBytes)(32).toString('hex');
        await this.prisma.passwordResetToken.create({
            data: { tokenHash: sha256(raw), userId: user.id, expiresAt: new Date(Date.now() + 3600 * 1000) },
        });
        const devMode = this.config.get('NODE_ENV') !== 'production';
        return { sent: true, ...(devMode ? { resetToken: raw } : {}) };
    }
    async resetPassword(token, newPassword) {
        const tokenHash = sha256(token);
        const rec = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
        if (!rec || rec.used || rec.expiresAt < new Date())
            throw new common_1.BadRequestException('Токен недействителен или истёк');
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.$transaction([
            this.prisma.user.update({ where: { id: rec.userId }, data: { passwordHash } }),
            this.prisma.passwordResetToken.update({ where: { id: rec.id }, data: { used: true } }),
            this.prisma.refreshToken.updateMany({ where: { userId: rec.userId }, data: { revoked: true } }),
        ]);
        return { ok: true };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService, config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map