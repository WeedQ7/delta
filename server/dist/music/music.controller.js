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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicController = void 0;
const common_1 = require("@nestjs/common");
const music_service_1 = require("./music.service");
const auth_guard_1 = require("../common/auth.guard");
const current_user_decorator_1 = require("../common/current-user.decorator");
const dtos_1 = require("../common/dtos");
let MusicController = class MusicController {
    constructor(music) {
        this.music = music;
    }
    search(q = '', genre) { return this.music.search(q, genre); }
    genres() { return this.music.genres(); }
    trending() { return this.music.trending(); }
    play(u, id) { return this.music.recordPlay(u.userId, id); }
    recent(u) { return this.music.recentForUser(u.userId); }
    recs(u) { return this.music.recommend(u.userId); }
    favorites(u) { return this.music.listFavorites(u.userId); }
    toggleFav(u, trackId) { return this.music.toggleFavorite(u.userId, trackId); }
    history(u) { return this.music.history(u.userId); }
    playlists(u) { return this.music.listPlaylists(u.userId); }
    createPl(u, dto) { return this.music.createPlaylist(u.userId, dto.title, dto.visibility); }
    getPl(u, id) { return this.music.getPlaylist(u.userId, id); }
    patchPl(u, id, dto) { return this.music.updatePlaylist(u.userId, id, dto); }
    delPl(u, id) { return this.music.deletePlaylist(u.userId, id); }
    addTrack(u, id, dto) { return this.music.addTrack(u.userId, id, dto.trackId); }
    removeTrack(u, id, trackId) { return this.music.removeTrack(u.userId, id, trackId); }
};
exports.MusicController = MusicController;
__decorate([
    (0, common_1.Get)('tracks/search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('genre')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('tracks/genres'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "genres", null);
__decorate([
    (0, common_1.Get)('tracks/trending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "trending", null);
__decorate([
    (0, common_1.Post)('tracks/:id/play'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "play", null);
__decorate([
    (0, common_1.Get)('me/recent'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "recent", null);
__decorate([
    (0, common_1.Get)('me/recommendations'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "recs", null);
__decorate([
    (0, common_1.Get)('me/favorites'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "favorites", null);
__decorate([
    (0, common_1.Post)('me/favorites/:trackId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('trackId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "toggleFav", null);
__decorate([
    (0, common_1.Get)('me/history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "history", null);
__decorate([
    (0, common_1.Get)('playlists'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "playlists", null);
__decorate([
    (0, common_1.Post)('playlists'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.CreatePlaylistDto]),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "createPl", null);
__decorate([
    (0, common_1.Get)('playlists/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "getPl", null);
__decorate([
    (0, common_1.Patch)('playlists/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_1.CreatePlaylistDto]),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "patchPl", null);
__decorate([
    (0, common_1.Delete)('playlists/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "delPl", null);
__decorate([
    (0, common_1.Post)('playlists/:id/tracks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_1.AddTrackDto]),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "addTrack", null);
__decorate([
    (0, common_1.Delete)('playlists/:id/tracks/:trackId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('trackId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MusicController.prototype, "removeTrack", null);
exports.MusicController = MusicController = __decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [music_service_1.MusicService])
], MusicController);
//# sourceMappingURL=music.controller.js.map