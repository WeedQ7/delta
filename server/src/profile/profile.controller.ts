import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../common/auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { UpdateProfileDto, UpdateSettingsDto, CreateReportDto } from '../common/dtos';

@Controller()
export class ProfileController {
  constructor(private profiles: ProfileService) {}

  @Get('users/search')
  @UseGuards(JwtAuthGuard)
  search(@Query('q') q = '') { return this.profiles.searchUsers(q); }

  @Get('users/:username')
  get(@Param('username') username: string, @CurrentUser() u: any) {
    return this.profiles.getPublicProfile(username, u?.userId);
  }

  @Get('users/:username/followers')
  followers(@Param('username') username: string) { return this.profiles.listFollowers(username); }

  @Get('users/:username/following')
  following(@Param('username') username: string) { return this.profiles.listFollowing(username); }

  @Post('users/:username/follow')
  @UseGuards(JwtAuthGuard)
  follow(@CurrentUser() u: any, @Param('username') username: string) { return this.profiles.toggleFollow(u.userId, username); }

  @Post('users/:username/block')
  @UseGuards(JwtAuthGuard)
  block(@CurrentUser() u: any, @Param('username') username: string) { return this.profiles.toggleBlock(u.userId, username); }

  @Get('me/friends')
  @UseGuards(JwtAuthGuard)
  friends(@CurrentUser() u: any) { return this.profiles.listFriends(u.userId); }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  patch(@CurrentUser() u: any, @Body() dto: UpdateProfileDto) { return this.profiles.updateProfile(u.userId, dto); }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  async avatar(@CurrentUser() u: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('Файл не получен');
    const { avatarUrl } = this.profiles.saveAvatar(u.userId, file);
    return this.profiles.setAvatar(u.userId, avatarUrl);
  }

  @Patch('me/settings')
  @UseGuards(JwtAuthGuard)
  settings(@CurrentUser() u: any, @Body() dto: UpdateSettingsDto) { return this.profiles.updateSettings(u.userId, dto as any); }

  @Post('reports')
  @UseGuards(JwtAuthGuard)
  report(@CurrentUser() u: any, @Body() dto: CreateReportDto) { return this.profiles.createReport(u.userId, dto.targetType, dto.targetId, dto.reason); }
}
