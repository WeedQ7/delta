import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const publicUserSelect = {
  id: true, username: true, createdAt: true,
  profile: { select: { displayName: true, bio: true, avatarUrl: true, visibility: true } },
};

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  private async blockedBetween(a: string, b: string) {
    const block = await this.prisma.block.findFirst({
      where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
    });
    return !!block;
  }

  async getPublicProfile(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { ...publicUserSelect, settings: { select: { privateProfile: true } }, _count: { select: { followers: true, following: true, posts: true } } },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    const isSelf = viewerId === user.id;
    if (!isSelf) {
      if (viewerId && await this.blockedBetween(viewerId, user.id)) throw new ForbiddenException('Профиль недоступен');
      if (user.settings?.privateProfile || user.profile?.visibility === 'PRIVATE') {
        // private account: only approved-style access = mutual follow in v1
        let allowed = false;
        if (viewerId) {
          const mutual = await this.prisma.follow.findFirst({ where: { followerId: viewerId, followeeId: user.id } });
          const back = await this.prisma.follow.findFirst({ where: { followerId: user.id, followeeId: viewerId } });
          allowed = !!(mutual && back);
        }
        if (!allowed) {
          return { username: user.username, createdAt: user.createdAt, private: true, displayName: user.profile?.displayName || user.username };
        }
      }
    }
    let following = false, mutual = false;
    if (viewerId && !isSelf) {
      const f = await this.prisma.follow.findUnique({ where: { followerId_followeeId: { followerId: viewerId, followeeId: user.id } } });
      const b = await this.prisma.follow.findUnique({ where: { followerId_followeeId: { followerId: user.id, followeeId: viewerId } } });
      following = !!f; mutual = !!(f && b);
    }
    const { settings, ...rest } = user;
    return { ...rest, private: false, viewerFollowing: following, viewerMutual: mutual, isSelf };
  }

  async updateProfile(userId: string, dto: { displayName?: string; bio?: string; visibility?: string }) {
    if (dto.visibility && !['PUBLIC', 'PRIVATE'].includes(dto.visibility)) throw new BadRequestException('Некорректная видимость');
    await this.prisma.userProfile.upsert({ where: { userId }, update: {}, create: { userId } });
    await this.prisma.userProfile.update({
      where: { userId },
      data: { displayName: dto.displayName, bio: dto.bio, visibility: dto.visibility as any },
    });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return this.getPublicProfile(user.username, userId);
  }

  async updateSettings(userId: string, dto: Record<string, boolean | undefined>) {
    return this.prisma.userSettings.update({ where: { userId }, data: dto });
  }

  /** Avatar upload: stored on disk under uploads/, served via /uploads static route. */
  saveAvatar(userId: string, file: Express.Multer.File): { avatarUrl: string } {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
    const ext = extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) throw new BadRequestException('Разрешены изображения png/jpg/webp/gif');
    const dir = process.env.UPLOAD_DIR || './uploads';
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const name = `${userId}-${randomUUID()}${ext}`;
    require('fs').writeFileSync(join(dir, name), file.buffer);
    const avatarUrl = `/uploads/${name}`;
    // fire-and-forget DB update through service caller
    return { avatarUrl };
  }

  async setAvatar(userId: string, avatarUrl: string) {
    return this.prisma.userProfile.update({ where: { userId }, data: { avatarUrl } });
  }

  async searchUsers(q: string, limit = 20) {
    return this.prisma.user.findMany({
      where: { OR: [{ username: { contains: q, mode: 'insensitive' } }, { profile: { displayName: { contains: q, mode: 'insensitive' } } }] },
      take: limit, select: publicUserSelect,
    });
  }

  // ---------- Follow / Block ----------
  async toggleFollow(followerId: string, targetUsername: string) {
    const target = await this.prisma.user.findUnique({ where: { username: targetUsername.toLowerCase() } });
    if (!target) throw new NotFoundException('Пользователь не найден');
    if (target.id === followerId) throw new BadRequestException('Нельзя подписаться на себя');
    if (await this.blockedBetween(followerId, target.id)) throw new ForbiddenException('Подписка невозможна');
    const existing = await this.prisma.follow.findUnique({ where: { followerId_followeeId: { followerId, followeeId: target.id } } });
    if (existing) {
      await this.prisma.follow.delete({ where: { followerId_followeeId: { followerId, followeeId: target.id } } });
      return { following: false };
    }
    await this.prisma.follow.create({ data: { followerId, followeeId: target.id } });
    const s = await this.prisma.userSettings.findUnique({ where: { userId: target.id } });
    if (s?.notifyOnFollow !== false) {
      await this.prisma.notification.create({ data: { recipientId: target.id, senderId: followerId, type: 'FOLLOW' } });
    }
    return { following: true };
  }

  async listFollowers(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } });
    if (!user) throw new NotFoundException();
    const rows = await this.prisma.follow.findMany({ where: { followeeId: user.id }, include: { follower: { select: publicUserSelect } } });
    return rows.map((r: any) => r.follower);
  }

  async listFollowing(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } });
    if (!user) throw new NotFoundException();
    const rows = await this.prisma.follow.findMany({ where: { followerId: user.id }, include: { followee: { select: publicUserSelect } } });
    return rows.map((r: any) => r.followee);
  }

  async listFriends(userId: string) {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: userId, followee: { followers: { some: { followerId: userId } } } },
      include: { followee: { select: publicUserSelect } },
    });
    return rows.map((r: any) => r.followee);
  }

  async toggleBlock(blockerId: string, targetUsername: string) {
    const target = await this.prisma.user.findUnique({ where: { username: targetUsername.toLowerCase() } });
    if (!target) throw new NotFoundException('Пользователь не найден');
    if (target.id === blockerId) throw new BadRequestException('Нельзя заблокировать себя');
    const existing = await this.prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId, blockedId: target.id } } });
    if (existing) {
      await this.prisma.block.delete({ where: { blockerId_blockedId: { blockerId, blockedId: target.id } } });
      return { blocked: false };
    }
    await this.prisma.$transaction([
      this.prisma.block.create({ data: { blockerId, blockedId: target.id } }),
      this.prisma.follow.deleteMany({ where: { OR: [{ followerId: blockerId, followeeId: target.id }, { followerId: target.id, followeeId: blockerId }] } }),
    ]);
    return { blocked: true };
  }

  async createReport(reporterId: string, targetType: string, targetId: string, reason: string) {
    if (targetType === 'USER') {
      const t = await this.prisma.user.findUnique({ where: { id: targetId } });
      if (!t) throw new NotFoundException('Пользователь не найден');
      if (t.id === reporterId) throw new BadRequestException('Нельзя пожаловаться на себя');
      return this.prisma.report.create({ data: { reporterId, targetType: 'USER', targetUserId: targetId, reason } });
    }
    if (targetType === 'POST') {
      const p = await this.prisma.post.findUnique({ where: { id: targetId } });
      if (!p || p.deletedAt) throw new NotFoundException('Пост не найден');
      return this.prisma.report.create({ data: { reporterId, targetType: 'POST', targetPostId: targetId, reason } });
    }
    throw new BadRequestException('Некорректный тип цели');
  }
}
