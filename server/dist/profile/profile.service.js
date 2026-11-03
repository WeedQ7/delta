"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
const path_1 = require("path");
const fs_1 = require("fs");
const publicUserSelect = {
    id: true, username: true, createdAt: true,
    profile: { select: { displayName: true, bio: true, avatarUrl: true, visibility: true } },
};
let ProfileService = class ProfileService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async blockedBetween(a, b) {
        const block = await this.prisma.block.findFirst({
            where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
        });
        return !!block;
    }
    async getPublicProfile(username, viewerId) {
        const user = await this.prisma.user.findUnique({
            where: { username: username.toLowerCase() },
            select: { ...publicUserSelect, settings: { select: { privateProfile: true } }, _count: { select: { followers: true, following: true, posts: true } } },
        });
        if (!user)
            throw new common_1.NotFoundException('Пользователь не найден');
        const isSelf = viewerId === user.id;
        if (!isSelf) {
            if (viewerId && await this.blockedBetween(viewerId, user.id))
                throw new common_1.ForbiddenException('Профиль недоступен');
            if (user.settings?.privateProfile || user.profile?.visibility === 'PRIVATE') {
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
            following = !!f;
            mutual = !!(f && b);
        }
        const { settings, ...rest } = user;
        return { ...rest, private: false, viewerFollowing: following, viewerMutual: mutual, isSelf };
    }
    async updateProfile(userId, dto) {
        if (dto.visibility && !['PUBLIC', 'PRIVATE'].includes(dto.visibility))
            throw new common_1.BadRequestException('Некорректная видимость');
        return this.prisma.userProfile.update({
            where: { userId },
            data: { displayName: dto.displayName, bio: dto.bio, visibility: dto.visibility },
        });
    }
    async updateSettings(userId, dto) {
        return this.prisma.userSettings.update({ where: { userId }, data: dto });
    }
    saveAvatar(userId, file) {
        const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
        const ext = (0, path_1.extname)(file.originalname).toLowerCase();
        if (!allowed.includes(ext))
            throw new common_1.BadRequestException('Разрешены изображения png/jpg/webp/gif');
        const dir = process.env.UPLOAD_DIR || './uploads';
        if (!(0, fs_1.existsSync)(dir))
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        const name = `${userId}-${(0, crypto_1.randomUUID)()}${ext}`;
        require('fs').writeFileSync((0, path_1.join)(dir, name), file.buffer);
        const avatarUrl = `/uploads/${name}`;
        return { avatarUrl };
    }
    async setAvatar(userId, avatarUrl) {
        return this.prisma.userProfile.update({ where: { userId }, data: { avatarUrl } });
    }
    async searchUsers(q, limit = 20) {
        return this.prisma.user.findMany({
            where: { OR: [{ username: { contains: q, mode: 'insensitive' } }, { profile: { displayName: { contains: q, mode: 'insensitive' } } }] },
            take: limit, select: publicUserSelect,
        });
    }
    async toggleFollow(followerId, targetUsername) {
        const target = await this.prisma.user.findUnique({ where: { username: targetUsername.toLowerCase() } });
        if (!target)
            throw new common_1.NotFoundException('Пользователь не найден');
        if (target.id === followerId)
            throw new common_1.BadRequestException('Нельзя подписаться на себя');
        if (await this.blockedBetween(followerId, target.id))
            throw new common_1.ForbiddenException('Подписка невозможна');
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
    async listFollowers(username) {
        const user = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } });
        if (!user)
            throw new common_1.NotFoundException();
        const rows = await this.prisma.follow.findMany({ where: { followeeId: user.id }, include: { follower: { select: publicUserSelect } } });
        return rows.map((r) => r.follower);
    }
    async listFollowing(username) {
        const user = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } });
        if (!user)
            throw new common_1.NotFoundException();
        const rows = await this.prisma.follow.findMany({ where: { followerId: user.id }, include: { followee: { select: publicUserSelect } } });
        return rows.map((r) => r.followee);
    }
    async listFriends(userId) {
        const rows = await this.prisma.follow.findMany({
            where: { followerId: userId, followee: { followers: { some: { followerId: userId } } } },
            include: { followee: { select: publicUserSelect } },
        });
        return rows.map((r) => r.followee);
    }
    async toggleBlock(blockerId, targetUsername) {
        const target = await this.prisma.user.findUnique({ where: { username: targetUsername.toLowerCase() } });
        if (!target)
            throw new common_1.NotFoundException('Пользователь не найден');
        if (target.id === blockerId)
            throw new common_1.BadRequestException('Нельзя заблокировать себя');
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
    async createReport(reporterId, targetType, targetId, reason) {
        if (targetType === 'USER') {
            const t = await this.prisma.user.findUnique({ where: { id: targetId } });
            if (!t)
                throw new common_1.NotFoundException('Пользователь не найден');
            if (t.id === reporterId)
                throw new common_1.BadRequestException('Нельзя пожаловаться на себя');
            return this.prisma.report.create({ data: { reporterId, targetType: 'USER', targetUserId: targetId, reason } });
        }
        if (targetType === 'POST') {
            const p = await this.prisma.post.findUnique({ where: { id: targetId } });
            if (!p || p.deletedAt)
                throw new common_1.NotFoundException('Пост не найден');
            return this.prisma.report.create({ data: { reporterId, targetType: 'POST', targetPostId: targetId, reason } });
        }
        throw new common_1.BadRequestException('Некорректный тип цели');
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfileService);
//# sourceMappingURL=profile.service.js.map