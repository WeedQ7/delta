import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MusicService } from './music.service';
import { JwtAuthGuard, OptionalAuth } from '../common/auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { AddTrackDto, CreatePlaylistDto } from '../common/dtos';

@Controller()
export class MusicController {
  constructor(private music: MusicService) {}

  // ---- public catalog (read-only, no auth required) ----
  @Get('tracks/search')
  search(@Query('q') q?: string, @Query('genre') genre?: string) {
    if (!q || !q.trim()) throw new BadRequestException('Укажите поисковый запрос "q"');
    return this.music.search(q, genre);
  }

  @Get('tracks/genres')
  genres() { return this.music.genres(); }

  @Get('tracks/trending')
  trending() { return this.music.trending(); }

  // ---- personal data (auth required) ----
  @Post('tracks/:id/play')
  @UseGuards(JwtAuthGuard)
  play(@CurrentUser() u: any, @Param('id') id: string) { return this.music.recordPlay(u.userId, id); }

  @Get('me/recent')
  @UseGuards(JwtAuthGuard)
  recent(@CurrentUser() u: any) { return this.music.recentForUser(u.userId); }

  @Get('me/recommendations')
  @UseGuards(JwtAuthGuard)
  recs(@CurrentUser() u: any) { return this.music.recommend(u.userId); }

  @Get('me/favorites')
  @UseGuards(JwtAuthGuard)
  favorites(@CurrentUser() u: any) { return this.music.listFavorites(u.userId); }

  @Post('me/favorites/:trackId')
  @UseGuards(JwtAuthGuard)
  toggleFav(@CurrentUser() u: any, @Param('trackId') trackId: string) { return this.music.toggleFavorite(u.userId, trackId); }

  @Get('me/history')
  @UseGuards(JwtAuthGuard)
  history(@CurrentUser() u: any) { return this.music.history(u.userId); }

  @Get('playlists')
  @UseGuards(JwtAuthGuard)
  playlists(@CurrentUser() u: any) { return this.music.listPlaylists(u.userId); }

  @Post('playlists')
  @UseGuards(JwtAuthGuard)
  createPl(@CurrentUser() u: any, @Body() dto: CreatePlaylistDto) { return this.music.createPlaylist(u.userId, dto.title, dto.visibility); }

  @Get('playlists/:id')
  @UseGuards(JwtAuthGuard)
  getPl(@CurrentUser() u: any, @Param('id') id: string) { return this.music.getPlaylist(u.userId, id); }

  @Patch('playlists/:id')
  @UseGuards(JwtAuthGuard)
  patchPl(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: CreatePlaylistDto) { return this.music.updatePlaylist(u.userId, id, dto); }

  @Delete('playlists/:id')
  @UseGuards(JwtAuthGuard)
  delPl(@CurrentUser() u: any, @Param('id') id: string) { return this.music.deletePlaylist(u.userId, id); }

  @Post('playlists/:id/tracks')
  @UseGuards(JwtAuthGuard)
  addTrack(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: AddTrackDto) { return this.music.addTrack(u.userId, id, dto.trackId); }

  @Delete('playlists/:id/tracks/:trackId')
  @UseGuards(JwtAuthGuard)
  removeTrack(@CurrentUser() u: any, @Param('id') id: string, @Param('trackId') trackId: string) { return this.music.removeTrack(u.userId, id, trackId); }
}
