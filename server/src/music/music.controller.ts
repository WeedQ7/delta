import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MusicService } from './music.service';
import { JwtAuthGuard } from '../common/auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { AddTrackDto, CreatePlaylistDto } from '../common/dtos';

@UseGuards(JwtAuthGuard)
@Controller()
export class MusicController {
  constructor(private music: MusicService) {}

  @Get('tracks/search')
  search(@Query('q') q = '', @Query('genre') genre?: string) { return this.music.search(q, genre); }

  @Get('tracks/genres')
  genres() { return this.music.genres(); }

  @Get('tracks/trending')
  trending() { return this.music.trending(); }

  @Post('tracks/:id/play')
  play(@CurrentUser() u: any, @Param('id') id: string) { return this.music.recordPlay(u.userId, id); }

  @Get('me/recent')
  recent(@CurrentUser() u: any) { return this.music.recentForUser(u.userId); }

  @Get('me/recommendations')
  recs(@CurrentUser() u: any) { return this.music.recommend(u.userId); }

  @Get('me/favorites')
  favorites(@CurrentUser() u: any) { return this.music.listFavorites(u.userId); }

  @Post('me/favorites/:trackId')
  toggleFav(@CurrentUser() u: any, @Param('trackId') trackId: string) { return this.music.toggleFavorite(u.userId, trackId); }

  @Get('me/history')
  history(@CurrentUser() u: any) { return this.music.history(u.userId); }

  @Get('playlists')
  playlists(@CurrentUser() u: any) { return this.music.listPlaylists(u.userId); }

  @Post('playlists')
  createPl(@CurrentUser() u: any, @Body() dto: CreatePlaylistDto) { return this.music.createPlaylist(u.userId, dto.title, dto.visibility); }

  @Get('playlists/:id')
  getPl(@CurrentUser() u: any, @Param('id') id: string) { return this.music.getPlaylist(u.userId, id); }

  @Patch('playlists/:id')
  patchPl(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: CreatePlaylistDto) { return this.music.updatePlaylist(u.userId, id, dto); }

  @Delete('playlists/:id')
  delPl(@CurrentUser() u: any, @Param('id') id: string) { return this.music.deletePlaylist(u.userId, id); }

  @Post('playlists/:id/tracks')
  addTrack(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: AddTrackDto) { return this.music.addTrack(u.userId, id, dto.trackId); }

  @Delete('playlists/:id/tracks/:trackId')
  removeTrack(@CurrentUser() u: any, @Param('id') id: string, @Param('trackId') trackId: string) { return this.music.removeTrack(u.userId, id, trackId); }
}
