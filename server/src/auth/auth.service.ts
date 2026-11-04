import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from '../common/dtos';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const username = dto.username.toLowerCase().trim();
    const existsEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existsEmail) throw new ConflictException('Email уже зарегистрирован');
    const existsUser = await this.prisma.user.findUnique({ where: { username } });
    if (existsUser) throw new ConflictException('Username уже занят');

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

  async login(dto: LoginDto, device = 'web') {
    const login = dto.login.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({ where: { OR: [{ email: login }, { username: login }] } });
    if (!user) throw new UnauthorizedException('Неверный логин или пароль');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Неверный логин или пароль');
    return this.issueTokens(user.id, user.username, device);
  }

  async issueTokens(userId: string, username: string, device: string) {
    const accessToken = await this.jwt.signAsync({ sub: userId, username });
    const refreshRaw = randomBytes(48).toString('hex');
    const tokenHash = sha256(refreshRaw);
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30 days
    await this.prisma.session.create({ data: { userId, device, expiresAt } });
    await this.prisma.refreshToken.create({ data: { tokenHash, userId, expiresAt } });
    return { accessToken, refreshToken: refreshRaw };
  }

  async refresh(refreshToken: string) {
    const tokenHash = sha256(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Сессия недействительна');
    }
    // rotate
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException();
    return this.issueTokens(user.id, user.username, 'refresh');
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({ where: { tokenHash: sha256(refreshToken) }, data: { revoked: true } });
    }
    return { ok: true };
  }

  /** Password recovery architecture: token is hashed in DB and single-use.
   *  In production the raw token is delivered via email; in dev mode it is returned directly. */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    // Do not leak whether the email exists
    if (!user) return { sent: true };
    const raw = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: { tokenHash: sha256(raw), userId: user.id, expiresAt: new Date(Date.now() + 3600 * 1000) },
    });
    const devMode = this.config.get('NODE_ENV') !== 'production';
    return { sent: true, ...(devMode ? { resetToken: raw } : {}) };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = sha256(token);
    const rec = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!rec || rec.used || rec.expiresAt < new Date()) throw new BadRequestException('Токен недействителен или истёк');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: rec.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: rec.id }, data: { used: true } }),
      this.prisma.refreshToken.updateMany({ where: { userId: rec.userId }, data: { revoked: true } }),
    ]);
    return { ok: true };
  }
}
