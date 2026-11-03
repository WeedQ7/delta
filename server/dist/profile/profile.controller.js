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
exports.ProfileController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const profile_service_1 = require("./profile.service");
const auth_guard_1 = require("../common/auth.guard");
const current_user_decorator_1 = require("../common/current-user.decorator");
const dtos_1 = require("../common/dtos");
let ProfileController = class ProfileController {
    constructor(profiles) {
        this.profiles = profiles;
    }
    search(q = '') { return this.profiles.searchUsers(q); }
    get(username, u) {
        return this.profiles.getPublicProfile(username, u?.userId);
    }
    followers(username) { return this.profiles.listFollowers(username); }
    following(username) { return this.profiles.listFollowing(username); }
    follow(u, username) { return this.profiles.toggleFollow(u.userId, username); }
    block(u, username) { return this.profiles.toggleBlock(u.userId, username); }
    friends(u) { return this.profiles.listFriends(u.userId); }
    patch(u, dto) { return this.profiles.updateProfile(u.userId, dto); }
    async avatar(u, file) {
        if (!file)
            throw new Error('Файл не получен');
        const { avatarUrl } = this.profiles.saveAvatar(u.userId, file);
        return this.profiles.setAvatar(u.userId, avatarUrl);
    }
    settings(u, dto) { return this.profiles.updateSettings(u.userId, dto); }
    report(u, dto) { return this.profiles.createReport(u.userId, dto.targetType, dto.targetId, dto.reason); }
};
exports.ProfileController = ProfileController;
__decorate([
    (0, common_1.Get)('users/search'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('users/:username'),
    __param(0, (0, common_1.Param)('username')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "get", null);
__decorate([
    (0, common_1.Get)('users/:username/followers'),
    __param(0, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "followers", null);
__decorate([
    (0, common_1.Get)('users/:username/following'),
    __param(0, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "following", null);
__decorate([
    (0, common_1.Post)('users/:username/follow'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "follow", null);
__decorate([
    (0, common_1.Post)('users/:username/block'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "block", null);
__decorate([
    (0, common_1.Get)('me/friends'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "friends", null);
__decorate([
    (0, common_1.Patch)('me/profile'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "patch", null);
__decorate([
    (0, common_1.Post)('me/avatar'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 2 * 1024 * 1024 } })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "avatar", null);
__decorate([
    (0, common_1.Patch)('me/settings'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.UpdateSettingsDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "settings", null);
__decorate([
    (0, common_1.Post)('reports'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.CreateReportDto]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "report", null);
exports.ProfileController = ProfileController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [profile_service_1.ProfileService])
], ProfileController);
//# sourceMappingURL=profile.controller.js.map