import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '../common/dtos';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private prisma: PrismaService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) { return this.auth.register(dto); }

  @Post('login')
  login(@Body() dto: LoginDto) { return this.auth.login(dto); }

  @Post('refresh')
  refresh(@Body('refreshToken') token: string) { return this.auth.refresh(token); }

  @Post('logout')
  logout(@Body('refreshToken') token: string) { return this.auth.logout(token); }

  @Post('forgot-password')
  forgot(@Body() dto: ForgotPasswordDto) { return this.auth.forgotPassword(dto.email); }

  @Post('reset-password')
  reset(@Body() dto: ResetPasswordDto) { return this.auth.resetPassword(dto.token, dto.newPassword); }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() u: { userId: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: u.userId },
      select: { id: true, email: true, username: true, createdAt: true, profile: true, settings: true },
    });
    return user;
  }
}
