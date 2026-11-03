import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../common/auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { CreatePostDto, CreateCommentDto } from '../common/dtos';

@UseGuards(JwtAuthGuard)
@Controller()
export class SocialController {
  constructor(private social: SocialService) {}

  @Post('posts')
  create(@CurrentUser() u: any, @Body() dto: CreatePostDto) { return this.social.createPost(u.userId, dto.text, dto.trackId); }

  @Delete('posts/:id')
  del(@CurrentUser() u: any, @Param('id') id: string) { return this.social.deletePost(u.userId, id); }

  @Get('feed')
  feed(@CurrentUser() u: any, @Query('cursor') cursor?: string) { return this.social.feed(u.userId, cursor); }

  @Get('users/:username/posts')
  userPosts(@CurrentUser() u: any, @Param('username') username: string) { return this.social.userPosts(username, u.userId); }

  @Post('posts/:id/like')
  like(@CurrentUser() u: any, @Param('id') id: string) { return this.social.toggleLike(u.userId, id); }

  @Post('posts/:id/comments')
  comment(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: CreateCommentDto) { return this.social.addComment(u.userId, id, dto.text); }

  @Get('posts/:id/comments')
  comments(@CurrentUser() u: any, @Param('id') id: string) { return this.social.listComments(id, u.userId); }

  @Get('notifications')
  notifications(@CurrentUser() u: any) { return this.social.notifications(u.userId); }

  @Get('notifications/unread')
  unread(@CurrentUser() u: any) { return this.social.unreadCount(u.userId); }

  @Post('notifications/read')
  read(@CurrentUser() u: any, @Body('ids') ids?: string[]) { return this.social.markRead(u.userId, ids); }
}
