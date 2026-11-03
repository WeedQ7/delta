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
exports.SocialService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const authorSelect = { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } };
const trackMini = { id: true, title: true, audioUrl: true, durationSec: true, coverSeed: true, genre: true, artist: { select: { name: true } } };
let SocialService = class SocialService {
    constructor(prisma) {
        this.prisma = prisma;
        this.postInclude = {
            author: { select: authorSelect },
            track: { select: trackMini },
            likes: { select: { userId: true } },
            comments: { orderBy: { createdAt: 'asc' }, take: 50, include: { author: { select: authorSelect } } },
        };
    }
    async blockedBetween(a, b) {
        const block = await this.prisma.block.findFirst({ where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] } });
        return !!block;
    }
    async createPost(userId, text, trackId) {
        if (!text.trim() && !trackId)
            throw new common_1.BadRequestException('Пустой пост');
        if (trackId) {
            const t = await this.prisma.track.findUnique({ where: { id: trackId } });
            if (!t)
                throw new common_1.NotFoundException('Трек не найден');
        }
        return this.prisma.post.create({ data: { authorId: userId, text: text.trim(), trackId, likesCount: 0, commentsCount: 0 }, include: this.postInclude });
    }
    async deletePost(userId, postId) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post || post.deletedAt)
            throw new common_1.NotFoundException('Пост не найден');
        if (post.authorId !== userId)
            throw new common_1.ForbiddenException('Можно удалять только свои посты');
        await this.prisma.post.update({ where: { id: postId }, data: { deletedAt: new Date() } });
        return { ok: true };
    }
    async feed(userId, cursor, limit = 20) {
        if (!userId) {
            const privateIds = (await this.prisma.userSettings.findMany({ where: { privateProfile: true }, select: { userId: true } })).map((x) => x.userId);
            const where = { deletedAt: null, authorId: { notIn: privateIds } };
            if (cursor)
                where.createdAt = { lt: new Date(cursor) };
            const posts = await this.prisma.post.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit + 1, include: this.postInclude });
            const hasMore = posts.length > limit;
            return { items: posts.slice(0, limit), nextCursor: hasMore ? posts[limit - 1].createdAt.toISOString() : null };
        }
        const followeeIds = (await this.prisma.follow.findMany({ where: { followerId: userId }, select: { followeeId: true } })).map((f) => f.followeeId);
        const blockedByMe = (await this.prisma.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } })).map((b) => b.blockedId);
        const blockedMe = (await this.prisma.block.findMany({ where: { blockedId: userId }, select: { blockerId: true } })).map((b) => b.blockerId);
        const excluded = [...new Set([...blockedByMe, ...blockedMe])];
        const where = {
            deletedAt: null,
            authorId: { in: [...followeeIds, userId] },
            ...(excluded.length ? { authorId_notIn: undefined } : {}),
        };
        where.authorId.notIn = excluded;
        if (cursor)
            where.createdAt = { lt: new Date(cursor) };
        const posts = await this.prisma.post.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit + 1, include: this.postInclude });
        const hasMore = posts.length > limit;
        const items = posts.slice(0, limit).map((p) => ({ ...p, likedByMe: userId ? p.likes.some((l) => l.userId === userId) : false, likesCount: p.likes.length }));
        return { items, nextCursor: hasMore && items.length ? items[items.length - 1].createdAt.toISOString() : null };
    }
    async userPosts(username, viewerId, limit = 30) {
        const user = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true, settings: { select: { privateProfile: true } }, profile: { select: { visibility: true } } } });
        if (!user)
            throw new common_1.NotFoundException('Пользователь не найден');
        if (viewerId !== user.id) {
            if (viewerId && await this.blockedBetween(viewerId, user.id))
                throw new common_1.ForbiddenException('Недоступно');
            if (user.settings?.privateProfile || user.profile?.visibility === 'PRIVATE') {
                const mutual = viewerId && (await this.prisma.follow.findFirst({ where: { followerId: viewerId, followeeId: user.id } })) && (await this.prisma.follow.findFirst({ where: { followerId: user.id, followeeId: viewerId } }));
                if (!mutual)
                    return [];
            }
        }
        const posts = await this.prisma.post.findMany({ where: { authorId: user.id, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: limit, include: this.postInclude });
        return posts.map((p) => ({ ...p, likedByMe: viewerId ? p.likes.some((l) => l.userId === viewerId) : false, likesCount: p.likes.length }));
    }
    async toggleLike(userId, postId) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post || post.deletedAt)
            throw new common_1.NotFoundException('Пост не найден');
        if (await this.blockedBetween(userId, post.authorId))
            throw new common_1.ForbiddenException('Недоступно');
        const existing = await this.prisma.postLike.findUnique({ where: { postId_userId: { postId, userId } } });
        if (existing) {
            await this.prisma.$transaction([
                this.prisma.postLike.delete({ where: { postId_userId: { postId, userId } } }),
                this.prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } }),
            ]);
            return { liked: false };
        }
        await this.prisma.$transaction([
            this.prisma.postLike.create({ data: { postId, userId } }),
            this.prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } }),
        ]);
        if (post.authorId !== userId) {
            const s = await this.prisma.userSettings.findUnique({ where: { userId: post.authorId } });
            if (s?.notifyOnLike !== false) {
                await this.prisma.notification.create({ data: { recipientId: post.authorId, senderId: userId, type: 'LIKE_POST', payload: { postId } } });
            }
        }
        return { liked: true };
    }
    async addComment(userId, postId, text) {
        const post = await this.prisma.post.findUnique({ where: { id: postId, deletedAt: null } });
        if (!post)
            throw new common_1.NotFoundException('Пост не найден');
        if (await this.blockedBetween(userId, post.authorId))
            throw new common_1.ForbiddenException('Недоступно');
        const s = await this.prisma.userSettings.findUnique({ where: { userId: post.authorId } });
        if (s?.allowComments === false)
            throw new common_1.ForbiddenException('Комментарии закрыты');
        const comment = await this.prisma.$transaction(async (tx) => {
            const c = await tx.comment.create({ data: { postId, authorId: userId, text: text.trim() }, include: { author: { select: authorSelect } } });
            await tx.post.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } });
            return c;
        });
        if (post.authorId !== userId) {
            if (s?.notifyOnComment !== false) {
                await this.prisma.notification.create({ data: { recipientId: post.authorId, senderId: userId, type: 'COMMENT', payload: { postId, commentId: comment.id } } });
            }
        }
        return comment;
    }
    async listComments(postId, viewerId) {
        const post = await this.prisma.post.findUnique({ where: { id: postId, deletedAt: null } });
        if (!post)
            throw new common_1.NotFoundException('Пост не найден');
        if (viewerId && await this.blockedBetween(viewerId, post.authorId))
            throw new common_1.ForbiddenException('Недоступно');
        return this.prisma.comment.findMany({ where: { postId, deletedAt: null }, orderBy: { createdAt: 'asc' }, include: { author: { select: authorSelect } } });
    }
    async notifications(userId, limit = 50) {
        return this.prisma.notification.findMany({
            where: { recipientId: userId }, orderBy: { createdAt: 'desc' }, take: limit,
            include: { sender: { select: authorSelect } },
        });
    }
    async unreadCount(userId) {
        return { count: await this.prisma.notification.count({ where: { recipientId: userId, readAt: null } }) };
    }
    async markRead(userId, ids) {
        if (ids && ids.length) {
            await this.prisma.notification.updateMany({ where: { recipientId: userId, id: { in: ids } }, data: { readAt: new Date() } });
        }
        else {
            await this.prisma.notification.updateMany({ where: { recipientId: userId, readAt: null }, data: { readAt: new Date() } });
        }
        return { ok: true };
    }
};
exports.SocialService = SocialService;
exports.SocialService = SocialService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SocialService);
//# sourceMappingURL=social.service.js.map