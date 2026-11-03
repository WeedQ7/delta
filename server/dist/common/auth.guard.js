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
exports.JwtAuthGuard = exports.OptionalAuth = exports.OptionalAuth_KEY = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
exports.OptionalAuth_KEY = 'delta:optional-auth';
const OptionalAuth = () => (0, common_1.SetMetadata)(exports.OptionalAuth_KEY, true);
exports.OptionalAuth = OptionalAuth;
let JwtAuthGuard = class JwtAuthGuard {
    constructor(jwt) {
        this.jwt = jwt;
    }
    async canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const auth = req.headers.authorization;
        const optional = !!ctx.getHandler()?.[exports.OptionalAuth_KEY];
        if (!auth || !auth.startsWith('Bearer ')) {
            if (optional)
                return true;
            throw new common_1.UnauthorizedException('Требуется авторизация');
        }
        try {
            const payload = await this.jwt.verifyAsync(auth.slice(7));
            req.user = { userId: payload.sub, username: payload.username };
            return true;
        }
        catch (e) {
            if (optional)
                return true;
            throw new common_1.UnauthorizedException('Сессия истекла, войдите заново');
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], JwtAuthGuard);
//# sourceMappingURL=auth.guard.js.map