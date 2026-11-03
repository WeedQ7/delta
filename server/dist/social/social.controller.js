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
exports.SocialController = void 0;
const common_1 = require("@nestjs/common");
const social_service_1 = require("./social.service");
const auth_guard_1 = require("../common/auth.guard");
const current_user_decorator_1 = require("../common/current-user.decorator");
const dtos_1 = require("../common/dtos");
let SocialController = class SocialController {
    constructor(social) {
        this.social = social;
    }
    create(u, dto) { return this.social.createPost(u.userId, dto.text, dto.trackId); }
    del(u, id) { return this.social.deletePost(u.userId, id); }
    feed(u, cursor) { return this.social.feed(u.userId, cursor); }
    userPosts(u, username) { return this.social.userPosts(username, u.userId); }
    like(u, id) { return this.social.toggleLike(u.userId, id); }
    comment(u, id, dto) { return this.social.addComment(u.userId, id, dto.text); }
    comments(u, id) { return this.social.listComments(id, u.userId); }
    notifications(u) { return this.social.notifications(u.userId); }
    unread(u) { return this.social.unreadCount(u.userId); }
    read(u, ids) { return this.social.markRead(u.userId, ids); }
};
exports.SocialController = SocialController;
__decorate([
    (0, common_1.Post)('posts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.CreatePostDto]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)('posts/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "del", null);
__decorate([
    (0, common_1.Get)('feed'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('cursor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "feed", null);
__decorate([
    (0, common_1.Get)('users/:username/posts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "userPosts", null);
__decorate([
    (0, common_1.Post)('posts/:id/like'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "like", null);
__decorate([
    (0, common_1.Post)('posts/:id/comments'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_1.CreateCommentDto]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "comment", null);
__decorate([
    (0, common_1.Get)('posts/:id/comments'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "comments", null);
__decorate([
    (0, common_1.Get)('notifications'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "notifications", null);
__decorate([
    (0, common_1.Get)('notifications/unread'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "unread", null);
__decorate([
    (0, common_1.Post)('notifications/read'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "read", null);
exports.SocialController = SocialController = __decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [social_service_1.SocialService])
], SocialController);
//# sourceMappingURL=social.controller.js.map