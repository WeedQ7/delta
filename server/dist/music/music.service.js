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
exports.MusicService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const trackSelect = {
    id: true, title: true, durationSec: true, audioUrl: true, genre: true,
    license: true, coverSeed: true, playCount: true,
    artist: { select: { id: true, name: true } },
    album: { select: { id: true, title: true, coverSeed: true, releaseYear: true } },
};
let MusicService = class MusicService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(q, genre, limit = 30) {
        const where = {};
        if (q)
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { artist: { name: { contains: q, mode: 'insensitive' } } },
                { album: { title: { contains: q, mode: 'insensitive' } } },
            ];
        if (genre && genre !== 'All')
            where.genre = genre;
        return this.prisma.track.findMany({ where, take: limit, select: trackSelect });
    }
    async genres() {
        const rows = await this.prisma.track.groupBy({ by: ['genre'], _count: true });
        return rows.map((r) => r.genre);
    }
    async trending(limit = 12) {
        return this.prisma.track.findMany({ orderBy: { playCount: 'desc' }, take: limit, select: trackSelect });
    }
    async recentForUser(userId, limit = 12) {
        const hist = await this.prisma.listeningHistory.findMany({
            where: { userId }, orderBy: { playedAt: 'desc' }, take: 50,
            include: { track: { select: trackSelect } },
        });
        const seen = new Set();
        const out = [];
        for (const h of hist) {
            if (!h.track || seen.has(h.track.id))
                continue;
            seen.add(h.track.id);
            out.push(h.track);
            if (out.length >= limit)
                break;
        }
        return out;
    }
    async recommend(userId, limit = 12) {
        const favs = await this.prisma.favorite.findMany({ where: { userId }, select: { track: { select: { genre: true, artistId: true } } }, take: 30 });
        const genres = [...new Set(favs.map((f) => f.track?.genre).filter(Boolean))];
        const artists = [...new Set(favs.map((f) => f.track?.artistId).filter(Boolean))];
        const listened = new Set((await this.prisma.listeningHistory.findMany({ where: { userId }, select: { trackId: true }, take: 500 })).map((h) => h.trackId));
        const candidates = await this.prisma.track.findMany({
            where: { OR: artists.length ? [{ artistId: { in: artists } }] : [], ...(genres.length ? [{ genre: { in: genres } }] : []) },
            take: limit + listened.size, select: trackSelect,
        });
        const fresh = candidates.filter((t) => !listened.has(t.id));
        if (fresh.length >= limit)
            return fresh.slice(0, limit);
        const rest = await this.prisma.track.findMany({ where: { id: { notIn: [...listened] } }, take: limit, select: trackSelect });
        return [...fresh, ...rest.filter((t) => !fresh.some((f) => f.id === t.id))].slice(0, limit);
    }
    async recordPlay(userId, trackId) {
        const track = await this.prisma.track.findUnique({ where: { id: trackId } });
        if (!track)
            throw new common_1.NotFoundException('Трек не найден');
        await this.prisma.$transaction([
            this.prisma.track.update({ where: { id: trackId }, data: { playCount: { increment: 1 } } }),
            this.prisma.listeningHistory.create({ data: { userId, trackId } }),
        ]);
        return { ok: true };
    }
    async listFavorites(userId) {
        return this.prisma.favorite.findMany({
            where: { userId }, orderBy: { createdAt: 'desc' },
            select: { track: { select: trackSelect } },
        }).then((rows) => rows.map((r) => r.track).filter(Boolean));
    }
    async toggleFavorite(userId, trackId) {
        const track = await this.prisma.track.findUnique({ where: { id: trackId } });
        if (!track)
            throw new common_1.NotFoundException('Трек не найден');
        const existing = await this.prisma.favorite.findUnique({ where: { userId_trackId: { userId, trackId } } });
        if (existing) {
            await this.prisma.favorite.delete({ where: { userId_trackId: { userId, trackId } } });
            return { favorite: false };
        }
        await this.prisma.favorite.create({ data: { userId, trackId } });
        return { favorite: true };
    }
    async listPlaylists(userId) {
        return this.prisma.playlist.findMany({
            where: { OR: [{ ownerId: userId }, { visibility: 'PUBLIC' }] },
            orderBy: { updatedAt: 'desc' },
            include: { _count: { select: { tracks: true } }, owner: { select: { username: true } } },
        });
    }
    async assertPlaylistAccess(userId, playlistId, write) {
        const pl = await this.prisma.playlist.findUnique({ where: { id: playlistId } });
        if (!pl)
            throw new common_1.NotFoundException('Плейлист не найден');
        if (pl.ownerId === userId)
            return pl;
        if (!write && pl.visibility === 'PUBLIC')
            return pl;
        throw new common_1.ForbiddenException('Нет доступа к плейлисту');
    }
    async getPlaylist(userId, playlistId) {
        const pl = await this.assertPlaylistAccess(userId, playlistId, false);
        const full = await this.prisma.playlist.findUnique({
            where: { id: pl.id },
            include: {
                tracks: { orderBy: { position: 'asc' }, select: { position: true, addedAt: true, track: { select: trackSelect } } },
                owner: { select: { username: true, id: true } },
            },
        });
        return full;
    }
    async createPlaylist(userId, title, visibility = 'PRIVATE') {
        if (!['PUBLIC', 'PRIVATE'].includes(visibility))
            throw new common_1.BadRequestException('Некорректная видимость');
        return this.prisma.playlist.create({ data: { ownerId: userId, title, visibility: visibility } });
    }
    async updatePlaylist(userId, playlistId, data) {
        const pl = await this.assertPlaylistAccess(userId, playlistId, true);
        if (data.visibility && !['PUBLIC', 'PRIVATE'].includes(data.visibility))
            throw new common_1.BadRequestException('Некорректная видимость');
        return this.prisma.playlist.update({ where: { id: pl.id }, data: { title: data.title, visibility: data.visibility } });
    }
    async deletePlaylist(userId, playlistId) {
        const pl = await this.assertPlaylistAccess(userId, playlistId, true);
        await this.prisma.playlist.delete({ where: { id: pl.id } });
        return { ok: true };
    }
    async addTrack(userId, playlistId, trackId) {
        const pl = await this.assertPlaylistAccess(userId, playlistId, true);
        const track = await this.prisma.track.findUnique({ where: { id: trackId } });
        if (!track)
            throw new common_1.NotFoundException('Трек не найден');
        const exists = await this.prisma.playlistTrack.findUnique({ where: { playlistId_trackId: { playlistId, trackId } } });
        if (exists)
            throw new common_1.BadRequestException('Трек уже в плейлисте');
        const count = await this.prisma.playlistTrack.count({ where: { playlistId } });
        await this.prisma.playlistTrack.create({ data: { playlistId, trackId, position: count } });
        await this.prisma.playlist.update({ where: { id: playlistId }, data: { updatedAt: new Date() } });
        return { ok: true };
    }
    async removeTrack(userId, playlistId, trackId) {
        await this.assertPlaylistAccess(userId, playlistId, true);
        await this.prisma.playlistTrack.deleteMany({ where: { playlistId, trackId } });
        const rest = await this.prisma.playlistTrack.findMany({ where: { playlistId }, orderBy: { position: 'asc' } });
        await this.prisma.$transaction(rest.map((r, i) => this.prisma.playlistTrack.update({ where: { playlistId_trackId: { playlistId, trackId: r.trackId } }, data: { position: i } })));
        return { ok: true };
    }
    async history(userId, limit = 50) {
        const rows = await this.prisma.listeningHistory.findMany({
            where: { userId }, orderBy: { playedAt: 'desc' }, take: limit,
            select: { playedAt: true, track: { select: trackSelect } },
        });
        return rows.filter((r) => r.track);
    }
};
exports.MusicService = MusicService;
exports.MusicService = MusicService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MusicService);
//# sourceMappingURL=music.service.js.map