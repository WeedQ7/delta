import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const authorSelect = { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } };
const trackMini = { id: true, title: true, audioUrl: true, durationSec: true, coverSeed: true, genre: true, artist: { select: { name: true } } };

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  private async blockedBetween(a: string, b: string) {
    const block = await this.prisma.block.findFirst({ where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] } });
    return !!block;
  }

  private postInclude = {
    author: { select: authorSelect },
    track: { select: trackMini },
    likes: { select: { userId: true } },
    comments: { orderBy: { createdAt: 'asc' as const }, take: 50, include: { author: { select: authorSelect } } },
  };

  async createPost(userId: string, text: string, trackId?: string) {
    if (!text.trim() && !trackId) throw new BadRequestException('Пустой пост');
    if (trackId) {
      const t = await this.prisma.track.findUnique({ where: { id: trackId } });
      if (!t) throw new NotFoundException('Трек не найден');
    }
    return this.prisma.post.create({ data: { authorId: userId, text: text.trim(), trackId, likesCount: 0, commentsCount: 0 }, include: this.postInclude });
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException('Пост не найден');
    if (post.authorId !== userId) throw new ForbiddenException('Можно удалять только свои посты');
    await this.prisma.post.update({ where: { id: postId }, data: { deletedAt: new Date() } });
    return { ok: true };
  }

  /** Feed: posts of followed users + own posts, excluding blocked relations. */
  async feed(userId?: string, cursor?: string, limit = 20) {
    if (!userId) {
      // anonymous/global view: posts of non-private accounts only
      const privateIds = (await this.prisma.userSettings.findMany({ where: { privateProfile: true }, select: { userId: true } })).map((x) => x.userId);
      const where: any = { deletedAt: null, authorId: { notIn: privateIds } };
      if (cursor) where.createdAt = { lt: new Date(cursor) };
      const posts = await this.prisma.post.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit + 1, include: this.postInclude });
      const hasMore = posts.length > limit;
      return { items: posts.slice(0, limit), nextCursor: hasMore ? posts[limit - 1].createdAt.toISOString() : null };
    }
    const followeeIds = (await this.prisma.follow.findMany({ where: { followerId: userId }, select: { followeeId: true } })).map((f) => f.followeeId);
    const blockedByMe = (await this.prisma.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } })).map((b) => b.blockedId);
    const blockedMe = (await this.prisma.block.findMany({ where: { blockedId: userId }, select: { blockerId: true } })).map((b) => b.blockerId);
    const excluded = [...new Set([...blockedByMe, ...blockedMe])];
    const where: any = {
      deletedAt: null,
      authorId: { in: [...followeeIds, userId] },
      ...(excluded.length ? { authorId_notIn: undefined } : {}),
    };
    // express "not in" for authors
    where.authorId.notIn = excluded;
    if (cursor) where.createdAt = { lt: new Date(cursor) };
    const posts = await this.prisma.post.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit + 1, include: this.postInclude });
    const hasMore = posts.length > limit;
    const items = posts.slice(0, limit).map((p) => ({ ...p, likedByMe: userId ? p.likes.some((l) => l.userId === userId) : false, likesCount: p.likes.length }));
    return { items, nextCursor: hasMore && items.length ? items[items.length - 1].createdAt.toISOString() : null };
  }

  /** Public user posts (profile wall), respecting blocks and private accounts. */
  async userPosts(username: string, viewerId?: string, limit = 30) {
    const user = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true, settings: { select: { privateProfile: true } }, profile: { select: { visibility: true } } } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    if (viewerId !== user.id) {
      if (viewerId && await this.blockedBetween(viewerId, user.id)) throw new ForbiddenException('Недоступно');
      if (user.settings?.privateProfile || user.profile?.visibility === 'PRIVATE') {
        const mutual = viewerId && (await this.prisma.follow.findFirst({ where: { followerId: viewerId, followeeId: user.id } })) && (await this.prisma.follow.findFirst({ where: { followerId: user.id, followeeId: viewerId } }));
        if (!mutual) return [];
      }
    }
    const posts = await this.prisma.post.findMany({ where: { authorId: user.id, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: limit, include: this.postInclude });
    return posts.map((p) => ({ ...p, likedByMe: viewerId ? p.likes.some((l) => l.userId === viewerId) : false, likesCount: p.likes.length }));
  }

  async toggleLike(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException('Пост не найден');
    if (await this.blockedBetween(userId, post.authorId)) throw new ForbiddenException('Недоступно');
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

  async addComment(userId: string, postId: string, text: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId, deletedAt: null } });
    if (!post) throw new NotFoundException('Пост не найден');
    if (await this.blockedBetween(userId, post.authorId)) throw new ForbiddenException('Недоступно');
    const s = await this.prisma.userSettings.findUnique({ where: { userId: post.authorId } });
    if (s?.allowComments === false) throw new ForbiddenException('Комментарии закрыты');
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

  async listComments(postId: string, viewerId?: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId, deletedAt: null } });
    if (!post) throw new NotFoundException('Пост не найден');
    if (viewerId && await this.blockedBetween(viewerId, post.authorId)) throw new ForbiddenException('Недоступно');
    return this.prisma.comment.findMany({ where: { postId, deletedAt: null }, orderBy: { createdAt: 'asc' }, include: { author: { select: authorSelect } } });
  }

  async notifications(userId: string, limit = 50) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId }, orderBy: { createdAt: 'desc' }, take: limit,
      include: { sender: { select: authorSelect } },
    });
  }

  async unreadCount(userId: string) {
    return { count: await this.prisma.notification.count({ where: { recipientId: userId, readAt: null } }) };
  }

  async markRead(userId: string, ids?: string[]) {
    if (ids && ids.length) {
      await this.prisma.notification.updateMany({ where: { recipientId: userId, id: { in: ids } }, data: { readAt: new Date() } });
    } else {
      await this.prisma.notification.updateMany({ where: { recipientId: userId, readAt: null }, data: { readAt: new Date() } });
    }
    return { ok: true };
  }
}
